function normalizeBaseUrl(raw: string): string {
  const idx = raw.indexOf("/v1");
  if (idx !== -1) {
    return raw.substring(0, idx + 3);
  }
  return raw;
}

const rawBaseUrl = process.env.CRSEC_MODEL_BASE_URL || "http://localhost:8000/v1";

export const CONFIG = {
  DOCS_URL: "https://js.langchain.com/docs",
  DOCS_URLS: [
    "https://js.langchain.com/docs/introduction",
    "https://js.langchain.com/docs/tutorials",
    "https://js.langchain.com/docs/how_to",
    "https://js.langchain.com/docs/concepts",
  ],
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  RETRIEVAL_K: 4,
  MAX_HISTORY_ROUNDS: 10,
  DOCS_JSON_PATH: "./data/documents.json",
  MODEL_BASE_URL: normalizeBaseUrl(rawBaseUrl),
  MODEL_NAME: process.env.CRSEC_MODEL_NAME || "deepseek-chat",
};
