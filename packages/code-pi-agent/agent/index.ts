import { Agent } from "@earendil-works/pi-agent-core";
import model, { models } from "./model.ts";

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant.",
    model,
  },
  streamFn: models.streamSimple.bind(models),
  beforeToolCall: async (context, signal) => {
    console.log("beforeToolCall", context);
    return undefined;
  },
});

agent.subscribe((event) => {
  if (event.type === "message_update") {
    // Stream just the new text chunk

    if (event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
    if (event.assistantMessageEvent.type === "text_end") {
      console.log("\ncontent>>>>>", event.assistantMessageEvent.content);
    }
  } else {
    console.log("event.type", event.type, event);
  }
});

await agent.prompt("Hello!");
