/**
 * Embedding generator using 火山引擎 API (OpenAI Compatible Mode).
 *
 * Generates embeddings for SDK documentation using Volcano Engine embedding models.
 */

import OpenAI from "openai";
import type { DocChunk } from "../ingestion/parser.js";

export interface EmbeddedChunk extends DocChunk {
  embedding: number[];
}

export class EmbeddingGenerator {
  private client: OpenAI;

  constructor(
    private apiKey: string,
    private model: string,
    private baseURL: string = "https://ark.cn-beijing.volces.com/api/v3",
    private dimension: number = 1024,
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  /** Generate embeddings for all chunks */
  async embedChunks(chunks: DocChunk[]): Promise<EmbeddedChunk[]> {
    const texts = chunks.map((chunk) => this.prepareText(chunk));

    console.log(`  Generating embeddings for ${texts.length} chunks...`);

    const embeddings = await this.batchEmbed(texts);

    console.log(`  ✓ Generated ${embeddings.length} embeddings`);

    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));
  }

  /** Embed a single query string */
  async embedQuery(query: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: [query],
      encoding_format: "float",
    });

    return response.data[0].embedding;
  }

  /**
   * Prepare text for embedding.
   * Combine name, keywords, and content excerpt.
   */
  private prepareText(chunk: DocChunk): string {
    return [
      `API: ${chunk.name}`,
      `Library: ${chunk.library}`,
      `Keywords: ${chunk.keywords.join(", ")}`,
      chunk.content.slice(0, 2000),
    ].join("\n");
  }

  /** Generate embeddings using OpenAI compatible API */
  private async batchEmbed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      encoding_format: "float",
    });

    return response.data.map((item) => item.embedding);
  }
}
