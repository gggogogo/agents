/**
 * Markdown documentation parser for SDK docs.
 *
 * Parses .md files into structured chunks (one file = one chunk).
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import { globSync } from "glob";

export interface DocChunk {
  id: string;
  library: string;
  name: string;
  content: string;
  keywords: string[];
  example: string;
  contentHash: string;
}

export class MarkdownParser {
  /** Parse a single .md file into a chunk */
  parseFile(filePath: string): DocChunk {
    const content = readFileSync(filePath, "utf-8");

    return {
      id: this.generateId(filePath),
      library: this.extractLibrary(filePath),
      name: this.extractName(content),
      content,
      keywords: this.extractKeywords(content),
      example: this.extractFirstCode(content),
      contentHash: createHash("sha256").update(content).digest("hex"),
    };
  }

  /** Extract API name from first heading */
  private extractName(content: string): string {
    const match = content.match(/^# (.+)/m);
    return match ? match[1].trim() : "Unknown";
  }

  /** Extract keywords from headings and code blocks */
  private extractKeywords(content: string): string[] {
    const keywords = new Set<string>();

    // Extract headings
    const headings = content.matchAll(/^##? (.+)/gm);
    for (const m of headings) {
      for (const word of m[1].split(/\s+/)) {
        keywords.add(word);
      }
    }

    // Extract identifiers from code blocks
    const codeBlocks = content.matchAll(/```[\w]*\n([\s\S]*?)\n```/g);
    for (const m of codeBlocks) {
      const identifiers = m[1].match(/\b[a-zA-Z_][\w-]*\b/g);
      if (identifiers) {
        for (const id of identifiers.slice(0, 5)) {
          keywords.add(id);
        }
      }
    }

    return [...keywords].slice(0, 20);
  }

  /** Extract first code block as example */
  private extractFirstCode(content: string): string {
    const match = content.match(/```[\w]*\n([\s\S]*?)\n```/);
    return match ? match[1].trim() : "";
  }

  /**
   * Generate unique chunk ID from file path.
   * "docs/@crsec/ui/CrsecNav.md" → "crsec-ui-CrsecNav"
   */
  private generateId(filePath: string): string {
    const normalized = filePath.replace(/@/g, "").replace(/\//g, "-").replace(/\.md$/, "");
    return normalized.includes("docs-")
      ? normalized.split("docs-").pop()!
      : basename(filePath, ".md");
  }

  /**
   * Extract library name from path.
   * "docs/@crsec/ui/Button.md" → "@crsec/ui"
   */
  private extractLibrary(filePath: string): string {
    const match = filePath.match(/@[\w-]+\/[\w-]+/);
    return match ? `@${match[0].replace(/^@/, "")}` : "unknown";
  }
}

export class DocumentLoader {
  private parser = new MarkdownParser();

  constructor(private docsDir: string) {}

  /** Load and parse all .md files */
  loadAll(): DocChunk[] {
    const chunks: DocChunk[] = [];
    const files = globSync(`${this.docsDir}/**/*.md`);

    for (const filePath of files) {
      try {
        const chunk = this.parser.parseFile(filePath);
        chunks.push(chunk);
        console.log(`  Parsed: ${chunk.id}`);
      } catch (err) {
        console.error(`  Failed to parse ${filePath}:`, err);
      }
    }

    return chunks;
  }
}
