import { z } from "zod";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  handler: (args: Record<string, any>) => Promise<string>;
}

export function toolToOpenAIFormat(tool: ToolDefinition): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    },
  };
}

function zodToJsonSchema(schema: z.ZodObject<any>): Record<string, any> {
  const shape = schema.shape;
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as z.ZodTypeAny;
    properties[key] = zodFieldToJson(zodType);
    if (!zodType.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function zodFieldToJson(field: z.ZodTypeAny): Record<string, any> {
  const description = field._def.description;
  const base: Record<string, any> = {};
  if (description) base.description = description;

  if (field instanceof z.ZodString) return { ...base, type: "string" };
  if (field instanceof z.ZodNumber) return { ...base, type: "number" };
  if (field instanceof z.ZodBoolean) return { ...base, type: "boolean" };
  if (field instanceof z.ZodEnum)
    return { ...base, type: "string", enum: field._def.values };
  if (field instanceof z.ZodArray)
    return { ...base, type: "array", items: zodFieldToJson(field._def.type) };
  if (field instanceof z.ZodOptional)
    return zodFieldToJson(field._def.innerType);
  return { ...base, type: "string" };
}
