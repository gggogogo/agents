import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { CONFIG } from "./config";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions about LangChain.js.
Use the following retrieved context to answer the question.
If you don't know the answer, say so. Keep answers concise.

Sources:
{context}`;

export function createLLM(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: CONFIG.MODEL_NAME,
    openAIApiKey: "not-needed",
    configuration: {
      baseURL: CONFIG.MODEL_BASE_URL,
    },
    temperature: 0.3,
    streaming: true,
  });
}

export function formatChatHistory(messages: BaseMessage[]): string {
  return messages
    .map((m) => {
      const role = m instanceof HumanMessage ? "User" : "Assistant";
      return `${role}: ${m.content}`;
    })
    .join("\n");
}

export async function createRagChain(vectorStore: MemoryVectorStore) {
  const llm = createLLM();
  const retriever = vectorStore.asRetriever(CONFIG.RETRIEVAL_K);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    ["human", "{question}"],
  ]);

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string; chat_history?: string }) => {
        const docs = await retriever.invoke(input.question);
        return formatDocumentsAsString(docs);
      },
      question: (input: { question: string; chat_history?: string }) => {
        if (input.chat_history) {
          return `Previous conversation:\n${input.chat_history}\n\nCurrent question: ${input.question}`;
        }
        return input.question;
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}
