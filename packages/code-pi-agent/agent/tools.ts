import { Type } from "typebox";
import type { AgentTool, ReadToolInput } from "@earendil-works/pi-agent-core";
import fs, { access, constants } from "fs/promises";

async function fileExists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export const readFileTool: AgentTool = {
  name: "read_file",
  label: "Read File", // For UI display
  description: "Read a file's contents",
  parameters: Type.Object({
    path: Type.String({ description: "File path" }),
  }),
  // Override execution mode for this tool (optional).
  // "sequential" forces the entire batch to run one at a time.
  // "parallel" allows concurrent execution with other tool calls.
  // If omitted, the global toolExecution config applies.
  executionMode: "sequential",
  execute: async (toolCallId, params: any, signal, onUpdate) => {
    if (!(await fileExists(params.path))) {
      throw new Error(`File not found: ${params.path}`);
    }
    const content = await fs.readFile(params.path, "utf-8");

    // Optional: stream progress
    onUpdate?.({
      content: [{ type: "text", text: "Reading..." }],
      details: {},
    });

    // Optional: add `terminate: true` here to skip the automatic follow-up LLM call
    // when every finalized tool result in the batch does the same.
    return {
      content: [{ type: "text", text: content }],
      details: { path: params.path, size: content.length },
    };
  },
};

export const lsTool: AgentTool = {
  name: "ls",
  label: "List Files", // For UI display
  description: "List files in a directory",
  parameters: Type.Object({
    path: Type.String({ description: "Directory path" }),
  }),
  // Override execution mode for this tool (optional).
  // "sequential" forces the entire batch to run one at a time.
  // "parallel" allows concurrent execution with other tool calls.
  // If omitted, the global toolExecution config applies.
  executionMode: "sequential",
  execute: async (toolCallId, params: any, signal, onUpdate) => {
    if (!(await fileExists(params.path))) {
      throw new Error(`Directory not found: ${params.path}`);
    }
    const files = await fs.readdir(params.path);

    // Optional: stream progress
    onUpdate?.({
      content: [{ type: "text", text: "Listing..." }],
      details: {},
    });

    return {
      content: [{ type: "text", text: files.join("\n") }],
      details: { path: params.path, count: files.length },
    };
  },
};
