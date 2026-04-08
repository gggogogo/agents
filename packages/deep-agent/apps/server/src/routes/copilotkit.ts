import { Hono } from "hono";
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { ChatAgent } from "../agents/chat-agent.js";

const copilotkit = new Hono();

const chatAgent = new ChatAgent();

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  agents: {
    default: chatAgent,
    langgraph: new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_URL ?? "http://localhost:8123",
      graphId: "chat",
    }),
  },
});

const handler = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

copilotkit.all("/*", async (c) => {
  // copilotRuntimeNodeHttpEndpoint accepts a Web Standard Request
  // and returns a Response when passed a Request object directly
  const response = await (handler as (req: Request) => Promise<Response>)(
    c.req.raw
  );
  return response;
});

export { copilotkit };
