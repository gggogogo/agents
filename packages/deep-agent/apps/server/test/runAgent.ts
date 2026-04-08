import { HttpAgent, EventType, AgentSubscriber } from "@ag-ui/client";

// Create an HTTP agent client pointing to the direct AG-UI endpoint
const agent = new HttpAgent({
  url: "http://localhost:4000/api/agent",
  threadId: "test-thread",
});

// Add a user message
agent.messages = [
  {
    id: "msg-1",
    role: "user",
    content: "你好",
  },
];

const subscriber: AgentSubscriber = {
  onEvent({ event }) {
    console.log(`[${event.type}]`, JSON.stringify(event).substring(0, 200));
  },
  onTextMessageContentEvent({ textMessageBuffer }) {
    process.stdout.write(`\r💬 ${textMessageBuffer}`);
  },
  onToolCallStartEvent({ event }) {
    console.log(`\n🔧 Tool call: ${(event as any).toolCallName}`);
  },
  onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
    console.log(`✅ Tool done: ${toolCallName}`, toolCallArgs);
  },
  onRunFinishedEvent() {
    console.log("\n\n✨ Run finished");
  },
};

// Start the agent
console.log("Starting agent run...\n");
agent.runAgent({}, subscriber).then(() => {
  console.log("Agent run complete.");
  process.exit(0);
}).catch((err) => {
  console.error("Agent failed:", err);
  process.exit(1);
});
