/**
 * Configuration settings for SDK RAG system.
 *
 * Loads configuration from .env file.
 */

import dotenv from "dotenv";

dotenv.config();

export const settings = {
  // Embedding (火山引擎 OpenAI 兼容接口)
  embedding: {
    apiKey: env("EMBED_API_KEY"),
    model: env("EMBED_MODEL_NAME"),
    baseURL: env("EMBED_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3"),
    dimension: envInt("EMBED_DIMENSION", 1024),
  },

  // Qdrant Vector Database
  qdrant: {
    url: env("QDRANT_URL", "http://localhost:6333"),
    apiKey: env("QDRANT_API_KEY", ""),
    collection: env("QDRANT_COLLECTION", "sdk_docs"),
  },

  // API Server
  api: {
    host: env("API_HOST", "0.0.0.0"),
    port: envInt("API_PORT", 3001),
  },

  // Logging
  logLevel: env("LOG_LEVEL", "info"),
} as const;

/** Validate required settings, throws on missing values */
export function validateSettings(): void {
  const required = [
    ["EMBED_API_KEY", settings.embedding.apiKey],
    ["EMBED_MODEL_NAME", settings.embedding.model],
    ["QDRANT_URL", settings.qdrant.url],
  ] as const;

  for (const [name, value] of required) {
    if (!value) {
      throw new Error(`${name} is required in .env`);
    }
  }
}

// --- Helpers ---

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : fallback;
}
