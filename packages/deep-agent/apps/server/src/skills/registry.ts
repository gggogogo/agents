import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

// ── Skill Manifest (parsed from SKILL.md frontmatter) ──────────────────────

/**
 * YAML frontmatter for a SKILL.md file.
 * Follows the official Claude Skills spec:
 *   https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
 *
 * Required fields: name, description
 * Optional fields: dependencies
 *
 * Example:
 * ```yaml
 * ---
 * name: summarize
 * description: Summarize text into a concise version. Use when the user asks to condense or extract key points.
 * ---
 * ```
 */
export interface SkillManifest {
  /** Unique skill name (used by the model in use_skill calls) */
  name: string;
  /** Description of what the skill does and when to use it (max 200 chars) */
  description: string;
  /** Optional software dependencies */
  dependencies?: string;
}

// ── Registered skill (manifest + body + directory) ─────────────────────────

export interface SkillEntry {
  manifest: SkillManifest;
  /** The Markdown body (instruction text to inject for the model) */
  body: string;
  /** The skill directory path (contains SKILL.md and optional resources) */
  dir: string;
  /** Source SKILL.md file path */
  source: string;
}

// ── SkillRegistry ──────────────────────────────────────────────────────────

class SkillRegistry {
  private skills = new Map<string, SkillEntry>();

  register(entry: SkillEntry): void {
    this.skills.set(entry.manifest.name, entry);
  }

  get(name: string): SkillEntry | undefined {
    return this.skills.get(name);
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  list(): SkillEntry[] {
    return Array.from(this.skills.values());
  }

  /**
   * Generate a catalog string for the system prompt so the model
   * knows which skills are available and when to use them.
   */
  catalog(): string {
    const skills = this.list();
    if (skills.length === 0) return "No skills available.";
    return skills
      .map((s) => `- **${s.manifest.name}**: ${s.manifest.description}`)
      .join("\n");
  }

  /**
   * Resolve a skill: look up the SKILL.md body and interpolate {{key}}
   * placeholders with the supplied args. Returns the instruction text.
   */
  resolve(name: string, args: Record<string, any> = {}): string {
    const entry = this.skills.get(name);
    if (!entry) {
      throw new Error(
        `Skill not found: ${name}. Available skills: ${this.list().map((s) => s.manifest.name).join(", ")}`
      );
    }

    let body = entry.body;
    for (const [key, value] of Object.entries(args)) {
      body = body.replaceAll(`{{${key}}}`, String(value));
    }
    return body;
  }

  /**
   * Scan a directory for skill subdirectories, each containing a SKILL.md.
   *
   * Expected structure (follows official Claude Skills spec):
   *   skills/
   *     summarize/
   *       SKILL.md          ← entry point (frontmatter + instructions)
   *       REFERENCE.md      ← optional supplemental info
   *       resources/        ← optional resource files
   *     pdf/
   *       SKILL.md
   *       FORMS.md
   *       REFERENCE.md
   */
  async discoverFromDirectory(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
      console.warn(`[skills] Failed to read directory ${dir}:`, err);
      return;
    }

    for (const entry of entries) {
      // Each skill is a subdirectory
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

      const skillDir = join(dir, entry.name);
      const skillFile = join(skillDir, "SKILL.md");

      try {
        const raw = await readFile(skillFile, "utf-8");
        const { data, content } = matter(raw);

        if (!isValidManifest(data)) {
          console.warn(
            `[skills] Skipping ${entry.name}/SKILL.md: missing required frontmatter fields (name, description)`
          );
          continue;
        }

        const manifest = data as SkillManifest;

        if (this.skills.has(manifest.name)) {
          console.warn(
            `[skills] Duplicate skill "${manifest.name}" from ${entry.name}/, skipping`
          );
          continue;
        }

        this.register({
          manifest,
          body: content.trim(),
          dir: skillDir,
          source: skillFile,
        });
        console.log(`[skills] Discovered skill "${manifest.name}" from ${entry.name}/SKILL.md`);
      } catch (err: any) {
        if (err?.code === "ENOENT") {
          console.warn(`[skills] Skipping ${entry.name}/: no SKILL.md found`);
        } else {
          console.error(`[skills] Failed to load skill from ${entry.name}/:`, err);
        }
      }
    }
  }
}

/** Validate that frontmatter has the required fields per Claude Skills spec */
function isValidManifest(data: Record<string, unknown>): boolean {
  return (
    typeof data.name === "string" &&
    typeof data.description === "string"
  );
}

export const skillRegistry = new SkillRegistry();
