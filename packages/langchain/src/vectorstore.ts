import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";
import crypto from "crypto";
import fs from "fs/promises";
import { CONFIG } from "./config";

class SimpleEmbeddings extends Embeddings {
  private dims = 384;

  constructor() {
    super({});
  }

  private hashToken(token: string): number {
    return parseInt(crypto.createHash("sha256").update(token).digest("hex").slice(0, 8), 16);
  }

  private tokenize(text: string): string[] {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const wordTokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
    const charBigrams: string[] = [];
    for (let i = 0; i < cleaned.length - 1; i++) {
      charBigrams.push("b:" + cleaned.slice(i, i + 2));
    }
    const charTrigrams: string[] = [];
    for (let i = 0; i < cleaned.length - 2; i++) {
      charTrigrams.push("t:" + cleaned.slice(i, i + 3));
    }
    return [...wordTokens, ...charBigrams, ...charTrigrams];
  }

  private embed(text: string): number[] {
    const tokens = this.tokenize(text);
    const vec = new Array(this.dims).fill(0);

    if (tokens.length === 0) return vec;

    for (const token of tokens) {
      const hash = this.hashToken(token);
      const idx = Math.abs(hash) % this.dims;
      vec[idx] += 1;
    }

    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < this.dims; i++) {
        vec[i] /= norm;
      }
    }

    return vec;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embed(t));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embed(text);
  }
}

export function createEmbeddings(): SimpleEmbeddings {
  return new SimpleEmbeddings();
}

export async function existsStoredDocs(): Promise<boolean> {
  try {
    await fs.access(CONFIG.DOCS_JSON_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function saveDocs(docs: Document[]): Promise<void> {
  const serializable = docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata,
  }));
  await fs.mkdir("./data", { recursive: true });
  await fs.writeFile(CONFIG.DOCS_JSON_PATH, JSON.stringify(serializable, null, 2), "utf-8");
  console.log(`Saved ${docs.length} chunks to ${CONFIG.DOCS_JSON_PATH}`);
}

export async function loadDocs(): Promise<Document[]> {
  const raw = await fs.readFile(CONFIG.DOCS_JSON_PATH, "utf-8");
  const items = JSON.parse(raw) as Array<{ pageContent: string; metadata: Record<string, any> }>;
  return items.map((item) => new Document({ pageContent: item.pageContent, metadata: item.metadata }));
}

export async function createVectorStore(docs: Document[]): Promise<MemoryVectorStore> {
  const embeddings = createEmbeddings();
  console.log("Creating vector store with embeddings...");
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  console.log(`Vector store created with ${docs.length} documents`);
  return store;
}

export async function loadVectorStore(): Promise<MemoryVectorStore> {
  const docs = await loadDocs();
  return createVectorStore(docs);
}
