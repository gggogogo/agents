import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools.js";

const model = new ChatOpenAI({
  model: process.env.LLM_MODEL_ID,
  apiKey: process.env.LLM_API_KEY!,
  configuration: {
    baseURL: process.env.LLM_BASE_URL,
  },
});

export const graph = createReactAgent({
  llm: model,
  tools,
});
