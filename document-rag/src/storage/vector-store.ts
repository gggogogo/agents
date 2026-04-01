/**
 * Qdrant vector store interface for SDK documentation.
 *
 * Handles vector storage and similarity search using Qdrant.
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { v5 as uuidv5 } from "uuid";
import type { EmbeddedChunk } from "../embeddings/embedder.js";

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // DNS namespace

export class VectorStore {
  private client: QdrantClient;

  constructor(
    private url: string,
    private collection: string,
    private dimension: number = 1024,
    apiKey?: string,
  ) {
    this.client = new QdrantClient({
      url,
      ...(apiKey ? { apiKey } : {}),
    });
  }

  /** Initialize collection if not exists */
  async init(): Promise<void> {
    try {
      await this.client.getCollection(this.collection);
      console.log(`  Collection '${this.collection}' already exists`);
    } catch {
      // Collection doesn't exist, create it
      await this.client.createCollection(this.collection, {
        vectors: {
          size: this.dimension,
          distance: "Cosine",
        },
      });
      console.log(`  Created collection '${this.collection}' (dim=${this.dimension})`);
    }

    // Ensure payload indexes
    const indexes: Array<{ field: string; schema: "keyword" | "text" }> = [
      { field: "library", schema: "keyword" },
      { field: "name", schema: "text" },
      { field: "content", schema: "text" },
    ];

    for (const { field, schema } of indexes) {
      try {
        await this.client.createPayloadIndex(this.collection, {
          field_name: field,
          field_schema: schema,
        });
      } catch {
        // Index might already exist
      }
    }
  }

  /** Insert or update chunks with embeddings */
  async insertChunks(chunks: EmbeddedChunk[]): Promise<void> {
    const points = chunks.map((chunk) => ({
      id: uuidv5(chunk.id, UUID_NAMESPACE),
      vector: chunk.embedding,
      payload: {
        id: chunk.id,
        library: chunk.library,
        name: chunk.name,
        content: chunk.content,
        keywords: chunk.keywords,
        example: chunk.example,
        content_hash: chunk.contentHash ?? "",
        created_at: new Date().toISOString(),
      },
    }));

    await this.client.upsert(this.collection, { points });

    console.log(`  Upserted ${chunks.length} chunks to Qdrant`);
  }

  /**
   * Get existing document hashes from the collection.
   * Returns a Map of chunk id → content_hash.
   */
  async getExistingHashes(): Promise<Map<string, string>> {
    const hashMap = new Map<string, string>();
    let offset: string | number | undefined = undefined;

    // Scroll through all points to collect hashes
    while (true) {
      const result = await this.client.scroll(this.collection, {
        limit: 100,
        with_payload: ["id", "content_hash"],
        with_vector: false,
        offset,
      });

      for (const point of result.points) {
        const payload = point.payload as Record<string, unknown>;
        const id = payload.id as string;
        const hash = (payload.content_hash as string) ?? "";
        hashMap.set(id, hash);
      }

      if (!result.next_page_offset) break;
      offset = result.next_page_offset as string | number;
    }

    return hashMap;
  }

  /** Delete points by their chunk IDs */
  async deleteByChunkIds(chunkIds: string[]): Promise<void> {
    if (chunkIds.length === 0) return;

    const pointIds = chunkIds.map((id) => uuidv5(id, UUID_NAMESPACE));
    await this.client.delete(this.collection, {
      points: pointIds,
    });

    console.log(`  Deleted ${chunkIds.length} chunks from Qdrant`);
  }

  /** Perform vector similarity search */
  async search(
    queryEmbedding: number[],
    topK: number = 5,
    libraryFilter?: string,
  ): Promise<SearchResult[]> {
    const filter = this.buildLibraryFilter(libraryFilter);

    const results = await this.client.query(this.collection, {
      query: queryEmbedding,
      limit: topK,
      filter,
      with_payload: true,
      with_vector: false,
    });

    return this.mapResults(results.points);
  }

  /** Perform keyword (full-text) search on name + content */
  async keywordSearch(
    query: string,
    topK: number = 5,
    libraryFilter?: string,
  ): Promise<SearchResult[]> {
    const textConditions = [
      { key: "name", match: { text: query } },
      { key: "content", match: { text: query } },
    ];

    const must = libraryFilter
      ? [{ key: "library", match: { value: libraryFilter } }]
      : [];

    const results = await this.client.scroll(this.collection, {
      filter: {
        must,
        should: textConditions,
      },
      limit: topK,
      with_payload: true,
      with_vector: false,
    });

    return this.mapResults(
      results.points.map((p) => ({ ...p, score: 1.0 })),
    );
  }

  /**
   * Hybrid search: vector + keyword, results merged by RRF (Reciprocal Rank Fusion).
   *
   * @param queryEmbedding - Query vector
   * @param queryText - Original query text for keyword matching
   * @param topK - Number of final results
   * @param libraryFilter - Optional library filter
   * @param k - RRF constant (default 60)
   */
  async hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    topK: number = 5,
    libraryFilter?: string,
    k: number = 60,
  ): Promise<SearchResult[]> {
    // Run vector and keyword search in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.search(queryEmbedding, topK * 2, libraryFilter),
      this.keywordSearch(queryText, topK * 2, libraryFilter),
    ]);

    // RRF fusion
    const scoreMap = new Map<string, { score: number; result: SearchResult }>();

    for (let i = 0; i < vectorResults.length; i++) {
      const r = vectorResults[i];
      const rrfScore = 1 / (k + i + 1);
      scoreMap.set(r.id, { score: rrfScore, result: r });
    }

    for (let i = 0; i < keywordResults.length; i++) {
      const r = keywordResults[i];
      const rrfScore = 1 / (k + i + 1);
      const existing = scoreMap.get(r.id);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scoreMap.set(r.id, { score: rrfScore, result: r });
      }
    }

    return [...scoreMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ score, result }) => ({ ...result, similarity: score }));
  }

  // --- Private helpers ---

  private buildLibraryFilter(libraryFilter?: string) {
    return libraryFilter
      ? {
          must: [
            {
              key: "library",
              match: { value: libraryFilter },
            },
          ],
        }
      : undefined;
  }

  private mapResults(
    points: Array<{ payload?: Record<string, unknown> | null; score: number }>,
  ): SearchResult[] {
    return points.map((hit) => {
      const payload = (hit.payload ?? {}) as Record<string, unknown>;
      return {
        id: payload.id as string,
        library: payload.library as string,
        name: payload.name as string,
        content: payload.content as string,
        keywords: payload.keywords as string[],
        example: payload.example as string,
        similarity: hit.score,
      };
    });
  }

  /** Scroll all points and return their payloads (for MCP tools) */
  async scrollAllPayloads(): Promise<Array<Record<string, unknown>>> {
    const payloads: Array<Record<string, unknown>> = [];
    let offset: string | number | undefined = undefined;

    while (true) {
      const result = await this.client.scroll(this.collection, {
        limit: 100,
        with_payload: true,
        with_vector: false,
        offset,
      });

      for (const point of result.points) {
        payloads.push((point.payload ?? {}) as Record<string, unknown>);
      }

      if (!result.next_page_offset) break;
      offset = result.next_page_offset as string | number;
    }

    return payloads;
  }

  /** Clear all chunks (for reindexing) */
  async deleteAll(): Promise<void> {
    await this.client.deleteCollection(this.collection);
    await this.init();
    console.log(`  Cleared collection '${this.collection}'`);
  }

  /** Get collection statistics */
  async getStats(): Promise<{ totalPoints: number; vectorSize: number; distance: string }> {
    const info = await this.client.getCollection(this.collection);

    const vectorsConfig = info.config.params.vectors;
    let vectorSize = this.dimension;
    let distance = "Cosine";

    if (typeof vectorsConfig === "object" && vectorsConfig !== null && "size" in vectorsConfig) {
      vectorSize = (vectorsConfig as { size: number }).size;
      distance = String((vectorsConfig as { distance: string }).distance);
    }

    return {
      totalPoints: info.points_count ?? 0,
      vectorSize,
      distance,
    };
  }
}

export interface SearchResult {
  id: string;
  library: string;
  name: string;
  content: string;
  keywords: string[];
  example: string;
  similarity: number;
}
