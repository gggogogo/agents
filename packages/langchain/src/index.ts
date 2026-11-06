import readline from "readline";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { loadDocuments } from "./loader";
import { splitDocuments } from "./splitter";
import { existsStoredDocs, saveDocs, loadDocs, createVectorStore, loadVectorStore } from "./vectorstore";
import { createRagChain, formatChatHistory } from "./chain";
import { CONFIG } from "./config";
import type { MemoryVectorStore } from "langchain/vectorstores/memory";

async function main() {
  console.log("\n=== LangChain RAG Agent ===\n");

  const hasExisting = await existsStoredDocs();
  let vectorStore: MemoryVectorStore;

  if (hasExisting) {
    console.log("Found existing knowledge base. Loading...");
    vectorStore = await loadVectorStore();
    const docs = await loadDocs();
    console.log(`Loaded ${docs.length} indexed chunks.\n`);
  } else {
    console.log("No existing knowledge base. Fetching documents...");
    const rawDocs = await loadDocuments();
    if (rawDocs.length === 0) {
      console.error("Failed to load any documents. Exiting.");
      process.exit(1);
    }
    const chunks = await splitDocuments(rawDocs);
    await saveDocs(chunks);
    vectorStore = await createVectorStore(chunks);
    console.log("Knowledge base ready.\n");
  }

  const ragChain = await createRagChain(vectorStore);
  const chatHistory: BaseMessage[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "You: ",
  });

  console.log('Type your questions about LangChain. Commands: /clear, /stat, /exit\n');

  rl.prompt();

  rl.on("line", async (input) => {
    const trimmed = input.trim();

    if (trimmed === "/exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    if (trimmed === "/clear") {
      chatHistory.length = 0;
      console.log("Chat history cleared.\n");
      rl.prompt();
      return;
    }

    if (trimmed === "/stat") {
      const docs = await loadDocs();
      console.log(`Knowledge base: ${docs.length} chunks | History: ${chatHistory.length / 2} rounds\n`);
      rl.prompt();
      return;
    }

    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      const historyStr = chatHistory.length > 0
        ? formatChatHistory(chatHistory.slice(-CONFIG.MAX_HISTORY_ROUNDS * 2))
        : undefined;

      chatHistory.push(new HumanMessage(trimmed));

      process.stdout.write("Agent: ");
      const stream = await ragChain.stream({
        question: trimmed,
        chat_history: historyStr,
      });
      let fullAnswer = "";
      for await (const chunk of stream) {
        process.stdout.write(chunk);
        fullAnswer += chunk;
      }
      process.stdout.write("\n\n");

      chatHistory.push(new AIMessage(fullAnswer));
    } catch (err) {
      console.error(`Error: ${(err as Error).message}\n`);
    }

    rl.prompt();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
