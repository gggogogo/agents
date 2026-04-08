import type { ToolDefinition } from "./types.js";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { toolToOpenAIFormat } from "./types.js";

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  toOpenAITools(): ChatCompletionTool[] {
    return this.list().map(toolToOpenAIFormat);
  }

  async execute(name: string, args: Record<string, any>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    const parsed = tool.parameters.safeParse(args);
    if (!parsed.success) {
      throw new Error(
        `Invalid arguments for tool ${name}: ${parsed.error.message}`
      );
    }
    return tool.handler(parsed.data);
  }
}

export const toolRegistry = new ToolRegistry();
