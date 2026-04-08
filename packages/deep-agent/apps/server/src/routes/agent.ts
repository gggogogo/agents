import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { ChatAgent } from "../agents/chat-agent.js";
import { v4 as uuid } from "uuid";

const agentRoute = new Hono();

/**
 * Direct AG-UI endpoint — accepts RunAgentInput as JSON body,
 * streams back AG-UI events as SSE.
 *
 * This endpoint lets AG-UI HttpAgent connect directly,
 * bypassing CopilotKit runtime.
 */
agentRoute.post("/", async (c) => {
  const body = await c.req.json();

  const input = {
    threadId: body.threadId || uuid(),
    runId: body.runId || uuid(),
    messages: body.messages || [],
    tools: body.tools || [],
    context: body.context || [],
    forwardedProps: body.forwardedProps || {},
    state: body.state,
  };

  const agent = new ChatAgent();
  const events$ = agent.run(input);

  return streamSSE(c, async (stream) => {
    await new Promise<void>((resolve, reject) => {
      events$.subscribe({
        next(event) {
          stream.writeSSE({
            data: JSON.stringify(event),
          });
        },
        error(err) {
          stream.writeSSE({
            data: JSON.stringify({
              type: "RUN_ERROR",
              message: err instanceof Error ? err.message : String(err),
            }),
          });
          resolve();
        },
        complete() {
          resolve();
        },
      });
    });
  });
});

export { agentRoute };
