import { type RunAgentInput, type BaseEvent, EventType } from "@ag-ui/core";
import { Observable } from "rxjs";
import { v4 as uuid } from "uuid";
import { BaseAgent } from "./base.js";
import {
  chatCompletionStream,
  type ChatCompletionMessageParam,
  type ChatCompletionTool,
  LLMError,
} from "../services/llm.js";
import { toolToOpenAIFormat } from "../tools/types.js";
import { toolRegistry } from "../tools/registry.js";
import { skillRegistry } from "../skills/registry.js";
import {
  getOrCreateSession,
  appendMessages,
} from "../services/session-store.js";

function buildSystemPrompt(): string {
  const skillCatalog = skillRegistry.catalog();
  return `You are a helpful AI assistant called Deep Agent. You can use tools to help answer questions. Be concise and helpful.

Available tools:
- getWeather: Check the weather for any location
- use_skill: Invoke a skill (see available skills below)

Available skills (invoke via the use_skill tool ONLY):
${skillCatalog}

IMPORTANT: When a skill matches the user's request, you MUST invoke it through the use_skill tool. Do NOT try to call skills by their name directly — always use use_skill with the skill name and JSON args.

When using tools, always explain what you're doing and present the results clearly.`;
}

export class ChatAgent extends BaseAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((observer) => {
      this.handleRun(input, observer).catch((err) => {
        const message = err instanceof LLMError && err.userMessage
          ? err.userMessage
          : err instanceof Error ? err.message : String(err);
        observer.next({
          type: EventType.RUN_ERROR,
          message,
        } as BaseEvent);
        observer.complete();
      });
    });
  }

  private async handleRun(
    input: RunAgentInput,
    rawObserver: {
      next: (event: BaseEvent) => void;
      complete: () => void;
    }
  ) {
    const { threadId, runId } = input;

    // Wrap observer to log every emitted event
    const observer = {
      next: (event: BaseEvent) => {
        console.log(
          `[copilotkit][${threadId}] event: ${event.type}`,
          "type" in event && event.type === "TEXT_MESSAGE_CONTENT"
            ? { delta: (event as any).delta?.slice(0, 40) }
            : { ...event, type: undefined }
        );
        rawObserver.next(event);
      },
      complete: () => rawObserver.complete(),
    };

    // Emit run started
    observer.next({
      type: EventType.RUN_STARTED,
      threadId,
      runId,
    } as BaseEvent);

    // Get or create session for message history
    const session = getOrCreateSession(threadId);

    // Build message list from input
    const inputMessages: ChatCompletionMessageParam[] =
      (input.messages ?? []).map((m: any) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content ?? "",
      }));

    // Combine session history with new messages for context
    // Only use input messages for the LLM call (CopilotKit manages history)
    const allMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt() },
      ...inputMessages,
    ];

    // Build tool list: backend tools (including use_skill) + frontend tools
    // Skills are NO LONGER exposed as individual tools — use_skill is the only entry point
    const backendTools = toolRegistry.toOpenAITools();

    // Frontend tools from CopilotKit (passed via input.tools)
    const frontendToolNames = new Set<string>();
    const frontendTools: ChatCompletionTool[] = (input.tools ?? []).map(
      (t: any) => {
        frontendToolNames.add(t.name);
        return {
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description ?? "",
            parameters: t.parameters ?? { type: "object", properties: {} },
          },
        };
      }
    );

    const allTools = [...backendTools, ...frontendTools];

    // Run the LLM loop (may need multiple iterations for tool calls)
    await this.llmLoop(
      allMessages,
      allTools,
      frontendToolNames,
      threadId,
      observer
    );

    // Emit run finished
    observer.next({
      type: EventType.RUN_FINISHED,
      threadId,
      runId,
    } as BaseEvent);

    observer.complete();
  }

  private async llmLoop(
    messages: ChatCompletionMessageParam[],
    tools: ChatCompletionTool[],
    frontendToolNames: Set<string>,
    threadId: string,
    observer: { next: (event: BaseEvent) => void }
  ) {
    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i++) {
      const stream = await chatCompletionStream({
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });

      const messageId = uuid();
      let hasToolCalls = false;
      let textStarted = false;

      // Accumulate tool call data from stream
      const toolCallAccumulator = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();
      let contentBuffer = "";

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        // Handle text content streaming
        if (delta.content) {
          if (!textStarted) {
            textStarted = true;
            observer.next({
              type: EventType.TEXT_MESSAGE_START,
              messageId,
              role: "assistant",
            } as BaseEvent);
          }
          contentBuffer += delta.content;
          observer.next({
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId,
            delta: delta.content,
          } as BaseEvent);
        }

        // Handle tool calls streaming
        if (delta.tool_calls) {
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCallAccumulator.has(idx)) {
              toolCallAccumulator.set(idx, {
                id: tc.id ?? uuid(),
                name: tc.function?.name ?? "",
                arguments: "",
              });
            }
            const acc = toolCallAccumulator.get(idx)!;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments)
              acc.arguments += tc.function.arguments;
          }
        }
      }

      // End text message if started
      if (textStarted) {
        observer.next({
          type: EventType.TEXT_MESSAGE_END,
          messageId,
        } as BaseEvent);
      }

      // If no tool calls, we're done
      if (!hasToolCalls) {
        // Store assistant message
        if (contentBuffer) {
          appendMessages(threadId, [
            { role: "assistant", content: contentBuffer },
          ]);
        }
        break;
      }

      // Process tool calls
      const assistantMessage: ChatCompletionMessageParam = {
        role: "assistant",
        content: contentBuffer || null,
        tool_calls: Array.from(toolCallAccumulator.values()).map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };
      messages.push(assistantMessage);

      // Execute each tool call
      for (const [, tc] of toolCallAccumulator) {
        const toolCallId = uuid();

        // Emit tool call start
        observer.next({
          type: EventType.TOOL_CALL_START,
          toolCallId,
          toolCallName: tc.name,
          parentMessageId: messageId,
        } as BaseEvent);

        // Emit tool call args
        observer.next({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: tc.arguments,
        } as BaseEvent);

        let result: string;

        // Check if this is a frontend tool (let CopilotKit handle it)
        if (frontendToolNames.has(tc.name)) {
          // For frontend tools, emit TOOL_CALL_END and let CopilotKit handle execution
          observer.next({
            type: EventType.TOOL_CALL_END,
            toolCallId,
          } as BaseEvent);
          // Don't add tool result to messages; CopilotKit manages this
          continue;
        }

        // Execute backend tool or skill
        let args: Record<string, any>;
        try {
          args = JSON.parse(tc.arguments);
        } catch {
          args = {};
        }

        try {
          result = await toolRegistry.execute(tc.name, args);
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }

        // Emit tool call end
        observer.next({
          type: EventType.TOOL_CALL_END,
          toolCallId,
        } as BaseEvent);

        // Emit tool call result
        observer.next({
          type: EventType.TOOL_CALL_RESULT,
          messageId: uuid(),
          toolCallId,
          content: result,
          role: "tool",
        } as BaseEvent);

        // Add tool result to messages for next LLM iteration
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        } as ChatCompletionMessageParam);
      }

      // If only frontend tool calls were made (no backend tools), stop the loop
      const hasBackendToolCalls = Array.from(toolCallAccumulator.values()).some(
        (tc) => !frontendToolNames.has(tc.name)
      );
      if (!hasBackendToolCalls) {
        break;
      }
      // Continue loop — LLM will process tool results
    }
  }
}
