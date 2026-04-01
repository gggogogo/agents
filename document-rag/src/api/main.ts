/**
 * Koa REST API for SDK Documentation RAG system.
 *
 * Provides endpoints for searching SDK documentation.
 */

import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { z } from "zod/v4";

import { settings, validateSettings } from "../config/settings.js";
import { EmbeddingGenerator } from "../embeddings/embedder.js";
import { VectorStore } from "../storage/vector-store.js";

// --- Zod Schemas ---

const SearchRequestSchema = z.object({
  query: z.string().min(1, "query is required"),
  top_k: z.number().int().min(1).max(20).default(5),
  library: z.string().optional(),
  mode: z.enum(["vector", "keyword", "hybrid"]).default("hybrid"),
});

// --- App Setup ---

const app = new Koa();
const router = new Router();

app.use(bodyParser());

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    ctx.status = error.status ?? 500;
    ctx.body = { error: error.message ?? "Internal Server Error" };
    console.error("[ERROR]", error.message);
  }
});

// --- Services ---

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

// --- Routes ---

/** POST /rag/search - Search SDK documentation */
router.post("/rag/search", async (ctx) => {
  const parsed = SearchRequestSchema.safeParse(ctx.request.body);

  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: "Invalid request", details: parsed.error.issues };
    return;
  }

  const { query, top_k, library, mode } = parsed.data;
  console.log(`[SEARCH] query="${query}" top_k=${top_k} library=${library ?? "all"} mode=${mode}`);

  let results;

  if (mode === "keyword") {
    // Keyword-only search (no embedding needed)
    results = await vectorStore.keywordSearch(query, top_k, library);
  } else {
    // Both vector and hybrid need embedding
    const queryEmbedding = await embedder.embedQuery(query);

    if (mode === "hybrid") {
      results = await vectorStore.hybridSearch(queryEmbedding, query, top_k, library);
    } else {
      results = await vectorStore.search(queryEmbedding, top_k, library);
    }
  }

  console.log(`[SEARCH] Found ${results.length} results`);

  // 3. Response
  ctx.body = {
    query,
    results,
    total: results.length,
  };
});

/** GET /health - Health check */
router.get("/health", (ctx) => {
  ctx.body = { status: "healthy", version: "1.0.0" };
});

/** GET /stats - System statistics */
router.get("/stats", async (ctx) => {
  const stats = await vectorStore.getStats();
  ctx.body = {
    total_chunks: stats.totalPoints,
    vector_size: stats.vectorSize,
    distance: stats.distance,
  };
});

app.use(router.routes()).use(router.allowedMethods());

// --- Start Server ---

const { host, port } = settings.api;
app.listen(port, host, () => {
  console.log(`🚀 SDK RAG API running at http://${host}:${port}`);
  console.log(`   POST /rag/search  - Search SDK docs`);
  console.log(`   GET  /health      - Health check`);
  console.log(`   GET  /stats       - Statistics`);
});
