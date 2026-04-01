#!/usr/bin/env tsx
/**
 * MCP Server entry point for SDK Documentation RAG.
 *
 * Supports three transport modes:
 *   - stdio (default): for local Agent integration (Claude Code, Cursor)
 *   - HTTP: for remote/shared deployment (--http --port 3002)
 *     - Streamable HTTP  →  POST/GET/DELETE /mcp  (Codex, newer clients)
 *     - SSE (deprecated) →  GET /sse + POST /messages  (Claude Code SSE mode)
 *
 * Usage:
 *   pnpm mcp                          # stdio mode
 *   pnpm mcp:http                     # HTTP mode on port 3002
 *   tsx src/mcp/server.ts --http      # HTTP mode
 */

import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { settings, validateSettings } from "../config/settings.js";
import { EmbeddingGenerator } from "../embeddings/embedder.js";
import { VectorStore } from "../storage/vector-store.js";
import { registerTools } from "./tools.js";

// ── Parse CLI args ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const httpMode = args.includes("--http");
const portIndex = args.indexOf("--port");
const httpPort = portIndex !== -1 ? Number(args[portIndex + 1]) : 3002;

// ── Initialize shared services ──────────────────────────────────────

validateSettings();

const embedder = new EmbeddingGenerator(
  settings.embedding.apiKey,
  settings.embedding.model,
  settings.embedding.baseURL,
  settings.embedding.dimension,
);

const vectorStore = new VectorStore(
  settings.qdrant.url,
  settings.qdrant.collection,
  settings.embedding.dimension,
  settings.qdrant.apiKey || undefined,
);

await vectorStore.init();

// ── Helper: create a wired McpServer instance ───────────────────────

function createMcpServer(): McpServer {
  const s = new McpServer({ name: "sdk-docs-rag", version: "1.0.0" });
  registerTools(s, embedder, vectorStore);
  return s;
}

// ── Start transport ─────────────────────────────────────────────────

if (httpMode) {
  // Store transports by session ID (shared between both protocols)
  const transports = new Map<string, StreamableHTTPServerTransport | SSEServerTransport>();

  // ── Helper: read raw body ──────────────────────────────────────
  function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://localhost:${httpPort}`);

    try {
      // ================================================================
      // Streamable HTTP  →  /mcp  (POST / GET / DELETE)
      // ================================================================
      if (url.pathname === "/mcp") {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport | undefined;

        if (sessionId && transports.has(sessionId)) {
          const existing = transports.get(sessionId)!;
          if (existing instanceof StreamableHTTPServerTransport) {
            transport = existing;
          } else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Session uses a different transport" }, id: null }));
            return;
          }
        } else if (!sessionId && req.method === "POST") {
          // Parse body to check if it's an initialize request
          const rawBody = await readBody(req);
          const body = JSON.parse(rawBody);

          if (isInitializeRequest(body)) {
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => randomUUID(),
              onsessioninitialized: (sid) => {
                transports.set(sid, transport!);
                console.error(`[MCP] Streamable HTTP session ${sid} initialized`);
              },
            });

            transport.onclose = () => {
              const sid = transport!.sessionId;
              if (sid) transports.delete(sid);
              console.error(`[MCP] Streamable HTTP session ${sid} closed`);
            };

            const s = createMcpServer();
            await s.connect(transport);
            await transport.handleRequest(req, res, body);
            return;
          } else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "No valid session ID" }, id: null }));
            return;
          }
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "No valid session ID" }, id: null }));
          return;
        }

        // Existing session — parse body for POST, pass through for GET/DELETE
        if (req.method === "POST") {
          const rawBody = await readBody(req);
          const body = JSON.parse(rawBody);
          await transport.handleRequest(req, res, body);
        } else {
          await transport.handleRequest(req, res);
        }
        return;
      }

      // ================================================================
      // SSE (deprecated)  →  GET /sse  +  POST /messages
      // ================================================================
      if (url.pathname === "/sse" && req.method === "GET") {
        const transport = new SSEServerTransport("/messages", res);
        transports.set(transport.sessionId, transport);

        transport.onclose = () => {
          transports.delete(transport.sessionId);
          console.error(`[MCP] SSE session ${transport.sessionId} closed`);
        };

        const s = createMcpServer();
        await s.connect(transport);
        console.error(`[MCP] SSE session ${transport.sessionId} established`);
        return;
      }

      if (url.pathname === "/messages" && req.method === "POST") {
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId || !transports.has(sessionId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
          return;
        }
        const transport = transports.get(sessionId)!;
        if (transport instanceof SSEServerTransport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session uses a different transport" }));
        }
        return;
      }

      // ================================================================
      // Health check
      // ================================================================
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "healthy", sessions: transports.size }));
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    } catch (err) {
      console.error("[MCP] Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }));
      }
    }
  });

  httpServer.listen(httpPort, () => {
    console.error(`[MCP] SDK Docs RAG server running at http://localhost:${httpPort}`);
    console.error(`  Streamable HTTP → POST /mcp`);
    console.error(`  SSE (legacy)    → GET  /sse`);
  });
} else {
  // stdio transport (default)
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] SDK Docs RAG server running on stdio");
}
