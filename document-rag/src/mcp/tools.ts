/**
 * MCP Tool handlers for SDK Documentation RAG.
 *
 * Registers search_sdk_docs, list_libraries, get_doc_detail tools
 * on an McpServer instance.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import type { EmbeddingGenerator } from "../embeddings/embedder.js";
import type { VectorStore, SearchResult } from "../storage/vector-store.js";

/**
 * Register all MCP Tools on the given server.
 */
export function registerTools(
  server: McpServer,
  embedder: EmbeddingGenerator,
  vectorStore: VectorStore,
): void {
  // ── search_sdk_docs ──────────────────────────────────────────────
  server.tool(
    "search_sdk_docs",
    "Search internal SDK documentation. Supports vector semantic search, keyword search, and hybrid search (default). Returns matching component docs with code examples.",
    {
      query: z.string().describe("Search query, e.g. 'dialog component usage' or 'semverGTE version comparison'"),
      mode: z.enum(["vector", "keyword", "hybrid"]).default("hybrid").describe("Search mode: vector (semantic), keyword (full-text), hybrid (both + RRF fusion)"),
      top_k: z.number().min(1).max(20).default(5).describe("Number of results to return (1-20)"),
      library: z.string().optional().describe("Filter by library, e.g. '@crsec/ui' or '@crsec/tiny-utils'"),
    },
    async ({ query, mode, top_k, library }) => {
      let results: SearchResult[];

      if (mode === "keyword") {
        results = await vectorStore.keywordSearch(query, top_k, library);
      } else {
        const queryEmbedding = await embedder.embedQuery(query);
        if (mode === "hybrid") {
          results = await vectorStore.hybridSearch(queryEmbedding, query, top_k, library);
        } else {
          results = await vectorStore.search(queryEmbedding, top_k, library);
        }
      }

      if (results.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No results found for query: "${query}"` }],
        };
      }

      const text = results
        .map((r, i) => {
          const header = `## [${i + 1}] ${r.name} (${r.library})`;
          const meta = `- **ID**: ${r.id}\n- **Keywords**: ${r.keywords.join(", ")}\n- **Similarity**: ${r.similarity.toFixed(4)}`;
          const content = r.content.length > 3000 ? r.content.slice(0, 3000) + "\n\n...(truncated)" : r.content;
          return `${header}\n${meta}\n\n${content}`;
        })
        .join("\n\n---\n\n");

      return {
        content: [
          { type: "text" as const, text: `Found ${results.length} results for "${query}" (mode: ${mode}):\n\n${text}` },
        ],
      };
    },
  );

  // ── list_libraries ───────────────────────────────────────────────
  server.tool(
    "list_libraries",
    "List all indexed SDK libraries with document counts. Use this to discover available libraries before searching.",
    {},
    async () => {
      const hashes = await vectorStore.getExistingHashes();

      // We need to scroll all points to get library info
      const libraryMap = new Map<string, number>();
      const allPoints = await scrollAllPayloads(vectorStore);

      for (const payload of allPoints) {
        const lib = (payload.library as string) ?? "unknown";
        libraryMap.set(lib, (libraryMap.get(lib) ?? 0) + 1);
      }

      if (libraryMap.size === 0) {
        return {
          content: [{ type: "text" as const, text: "No libraries indexed yet. Run `pnpm index --docs-dir ./docs` to index documentation." }],
        };
      }

      const lines = [...libraryMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([lib, count]) => `- **${lib}**: ${count} documents`);

      const stats = await vectorStore.getStats();

      return {
        content: [
          {
            type: "text" as const,
            text: `## Indexed Libraries\n\n${lines.join("\n")}\n\n**Total**: ${stats.totalPoints} documents in collection`,
          },
        ],
      };
    },
  );

  // ── get_doc_detail ───────────────────────────────────────────────
  server.tool(
    "get_doc_detail",
    "Get full documentation content by document ID. Use when you already know the exact document ID from a previous search result.",
    {
      doc_id: z.string().describe("Document ID, e.g. 'crsec-ui-CrsecDialog'"),
    },
    async ({ doc_id }) => {
      const allPoints = await scrollAllPayloads(vectorStore);
      const doc = allPoints.find((p) => p.id === doc_id);

      if (!doc) {
        return {
          content: [{ type: "text" as const, text: `Document not found: "${doc_id}". Use list_libraries or search_sdk_docs to find valid IDs.` }],
        };
      }

      const text = [
        `# ${doc.name as string}`,
        `- **Library**: ${doc.library as string}`,
        `- **ID**: ${doc.id as string}`,
        `- **Keywords**: ${(doc.keywords as string[]).join(", ")}`,
        "",
        doc.content as string,
      ].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    },
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Scroll all points from the vector store and return their payloads.
 * Reuses VectorStore's Qdrant client via getExistingHashes-style scrolling.
 */
async function scrollAllPayloads(
  vectorStore: VectorStore,
): Promise<Array<Record<string, unknown>>> {
  // Access the underlying client via a public helper
  return vectorStore.scrollAllPayloads();
}
