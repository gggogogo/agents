import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import { skillRegistry } from "../../skills/registry.js";

/**
 * Unified SkillTool — the ONLY entry point for the LLM to invoke skills.
 *
 * A skill is a directory containing a SKILL.md with YAML frontmatter.
 * "Executing" a skill means resolving its Markdown body (interpolating
 * {{key}} placeholders with args) and returning the instruction text
 * for the model to follow in the conversation.
 */
export const useSkillTool: ToolDefinition = {
  name: "use_skill",
  description:
    "Execute a skill within the main conversation.\n\n" +
    "When users ask you to perform tasks, check if any of the available skills match.\n\n" +
    "How to invoke:\n" +
    "- Use this tool with the skill name and optional arguments\n" +
    "- Examples:\n" +
    '  - `skill: "summarize", args: \'{"text": "...", "maxLength": 100}\'`\n' +
    '  - `skill: "brand-guidelines"` (no args needed)\n\n' +
    "Important:\n" +
    "- When a skill matches the user's request, this is a BLOCKING REQUIREMENT:\n" +
    "  invoke the relevant Skill tool BEFORE generating any other response",
  parameters: z.object({
    skill: z.string().describe("The name of the skill to invoke"),
    args: z
      .string()
      .optional()
      .describe(
        "JSON object string with key-value pairs to interpolate into the skill template, e.g. '{\"text\": \"hello\"}'"
      ),
  }),
  handler: async (rawArgs: Record<string, any>): Promise<string> => {
    const { skill: skillName, args: argsStr } = rawArgs as {
      skill: string;
      args?: string;
    };

    // Parse args — expects a JSON object for template interpolation
    let skillArgs: Record<string, any> = {};
    if (argsStr) {
      try {
        skillArgs = JSON.parse(argsStr);
      } catch {
        return JSON.stringify({
          skill: skillName,
          error: `Invalid JSON in args: ${argsStr}`,
        });
      }
    }

    try {
      const entry = skillRegistry.get(skillName);
      const instruction = skillRegistry.resolve(skillName, skillArgs);
      return JSON.stringify({
        skill: skillName,
        description: entry?.manifest.description ?? "",
        args: skillArgs,
        instruction,
      });
    } catch (err) {
      return JSON.stringify({
        skill: skillName,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
