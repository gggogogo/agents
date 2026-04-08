import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";

export type { ChatCompletionMessageParam, ChatCompletionTool };

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = "LLMError";
  }

  static fromApiError(err: unknown): LLMError {
    console.log(
      "FBI WARNING>>>>>>>> ~ llm.ts:21 ~ LLMError ~ fromApiError ~ err:",
      err,
    );
    const status = (err as any)?.status as number | undefined;
    const raw = err instanceof Error ? err.message : String(err);
    const userMessages: Record<number, string> = {
      429: "LLM API rate limit reached, please try again later.",
      500: "LLM service internal error, please try again.",
      503: "LLM service is temporarily overloaded, please try again in a moment.",
    };
    const userMessage = status
      ? (userMessages[status] ?? `LLM service error (${status}).`)
      : raw;
    return new LLMError(raw, status, userMessage);
  }
}

export interface LLMConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface LLMStreamOptions {
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  temperature?: number;
}

let client: OpenAI | null = null;
let currentConfig: LLMConfig | null = null;

export function initLLM(config: LLMConfig) {
  currentConfig = config;
  client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

function getClient(): OpenAI {
  if (!client || !currentConfig) {
    throw new Error("LLM not initialized. Call initLLM() first.");
  }
  return client;
}

function isDebug(): boolean {
  return process.env.LLM_DEBUG === "1" || process.env.LLM_DEBUG === "true";
}

function debugLog(label: string, data: unknown) {
  if (!isDebug()) return;
  console.log(`[llm:debug] ${label}:`, JSON.stringify(data, null, 2));
}

export function getModel(): string {
  if (!currentConfig) {
    throw new Error("LLM not initialized. Call initLLM() first.");
  }
  return currentConfig.model;
}

/**
 * Non-streaming chat completion. Returns the full response.
 */
export async function chatCompletion(options: LLMStreamOptions) {
  const openai = getClient();
  const params: any = {
    model: getModel(),
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.tools && options.tools.length > 0) {
    params.tools = options.tools;
  }
  debugLog("chatCompletion:input", { model: params.model, messages: params.messages, tools: params.tools?.map((t: any) => t.function?.name) });
  const result = await openai.chat.completions.create(params);
  debugLog("chatCompletion:output", result.choices?.[0]?.message);
  return result;
}

/**
 * Streaming chat completion. Returns an async iterable of chunks.
 */
export async function chatCompletionStream(options: LLMStreamOptions) {
  const openai = getClient();
  const params: ChatCompletionCreateParamsStreaming = {
    model: getModel(),
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    stream: true,
  };
  if (options.tools && options.tools.length > 0) {
    (params as any).tools = options.tools;
  }
  debugLog("chatCompletionStream:input", { model: params.model, messages: params.messages, tools: (params as any).tools?.map((t: any) => t.function?.name) });
  try {
    return await openai.chat.completions.create(params);
  } catch (err) {
    throw LLMError.fromApiError(err);
  }
}
