import {
  Agent,
  createReadTool,
  createLsToolDefinition,
} from "@earendil-works/pi-agent-core";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { NodeExecutionEnv } from "@earendil-works/pi-agent-core/node";
import model, { models } from "./model.ts";
// import { readFileTool, lsTool } from "./tools.ts";

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant.",
    model,
  },
  streamFn: models.streamSimple.bind(models),
  // beforeToolCall: async (context, signal) => {
  //   console.log("beforeToolCall", context);
  //   return undefined;
  // },
});
// createReadTool() 是 harness 工具：execute 需要第 5 个参数 context（提供 env）。
// 低层 Agent 只按 4 参数调用，这里用 NodeExecutionEnv 手动绑定适配。
const env = new NodeExecutionEnv({ cwd: process.cwd() });
const harnessRead = createReadTool();
const readTool: AgentTool = {
  ...harnessRead,
  execute: (toolCallId, params, signal, onUpdate) =>
    harnessRead.execute(toolCallId, params as never, signal, onUpdate, { env }),
};
const harnessLs = createLsToolDefinition();
const lsTool: AgentTool = {
  ...harnessLs,
  execute: (toolCallId, params, signal, onUpdate) =>
    harnessLs.execute(toolCallId, params as never, signal, onUpdate, { env }),
};



agent.state.tools = [readTool, lsTool];

agent.subscribe((event) => {
  if (event.type === "message_update") {
    // Stream just the new text chunk
    if (event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  } else if (event.type === "message_end" || event.type === "message_start") {
    // @ts-ignore
    console.log(event.type, "============>", event.message.content);
  } else if (event.type === "tool_execution_start") {
    console.log(event.type, "============>", event.toolName, event.args);
  } else if (event.type === "tool_execution_end") {
    console.log(
      event.type,
      "============>",
      event.toolName,
      JSON.stringify(event.result),
    );
  } else {
    // @ts-ignore
    // console.log("event.type", event);
  }
});

await agent.prompt("read .npmrc!");
