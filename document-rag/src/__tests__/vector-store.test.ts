/**
 * Vector Store 单元测试
 *
 * 测试 Qdrant 连接、集合初始化、数据插入与查询。
 * 需要运行中的 Qdrant 实例（默认 http://localhost:6333）。
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import { VectorStore, type SearchResult } from "../storage/vector-store.js";
import type { EmbeddedChunk } from "../embeddings/embedder.js";

dotenv.config();

const TEST_COLLECTION = "test_sdk_docs";
const DIMENSION = 4; // 小维度用于测试

/** 生成指定维度的随机向量 */
function randomVector(dim: number): number[] {
  return Array.from({ length: dim }, () => Math.random());
}

/** 构造测试用的 EmbeddedChunk */
function makeChunk(id: string, library: string, overrides?: Partial<EmbeddedChunk>): EmbeddedChunk {
  return {
    id,
    library,
    name: `Test ${id}`,
    content: `# Test ${id}\n\nSome content for ${id}`,
    keywords: ["test", id],
    example: `import { ${id} } from '${library}'`,
    contentHash: "test-hash-" + id,
    embedding: randomVector(DIMENSION),
    ...overrides,
  };
}

describe("VectorStore", () => {
  let store: VectorStore;

  beforeAll(async () => {
    store = new VectorStore(
      process.env.QDRANT_URL || "http://localhost:6333",
      TEST_COLLECTION,
      DIMENSION,
      process.env.QDRANT_API_KEY || undefined,
    );

    // 确保从干净状态开始
    try {
      await store.deleteAll();
    } catch {
      // 集合可能不存在，忽略
    }
    await store.init();
  }, 30_000);

  afterAll(async () => {
    // 清理测试集合
    try {
      await store.deleteAll();
    } catch {
      // ignore
    }
  });

  describe("连接与初始化", () => {
    it("应成功连接并获取集合信息", async () => {
      const stats = await store.getStats();

      expect(stats).toHaveProperty("totalPoints");
      expect(stats).toHaveProperty("vectorSize");
      expect(stats).toHaveProperty("distance");
      expect(stats.vectorSize).toBe(DIMENSION);
      expect(stats.distance).toMatch(/cosine/i);
    });

    it("重复 init() 不应报错", async () => {
      await expect(store.init()).resolves.toBeUndefined();
    });
  });

  describe("数据插入", () => {
    it("应成功插入单个 chunk", async () => {
      const chunk = makeChunk("comp-A", "@test/ui");
      await store.insertChunks([chunk]);

      const stats = await store.getStats();
      expect(stats.totalPoints).toBeGreaterThanOrEqual(1);
    });

    it("应成功批量插入多个 chunks", async () => {
      const chunks = [
        makeChunk("comp-B", "@test/ui"),
        makeChunk("func-C", "@test/utils"),
        makeChunk("func-D", "@test/utils"),
      ];
      await store.insertChunks(chunks);

      const stats = await store.getStats();
      expect(stats.totalPoints).toBeGreaterThanOrEqual(4);
    });

    it("相同 id 的 chunk 应执行 upsert（不重复）", async () => {
      const before = await store.getStats();

      const chunk = makeChunk("comp-A", "@test/ui", {
        content: "# Updated content",
      });
      await store.insertChunks([chunk]);

      const after = await store.getStats();
      expect(after.totalPoints).toBe(before.totalPoints);
    });
  });

  describe("查询与过滤", () => {
    it("应返回 top_k 个结果", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.search(queryVec, 2);

      expect(results.length).toBeLessThanOrEqual(2);
      expect(results.length).toBeGreaterThan(0);
    });

    it("结果应包含完整的 payload 字段", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.search(queryVec, 1);

      expect(results.length).toBe(1);
      const r = results[0];
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("library");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("content");
      expect(r).toHaveProperty("keywords");
      expect(r).toHaveProperty("example");
      expect(r).toHaveProperty("similarity");
      expect(typeof r.similarity).toBe("number");
    });

    it("应支持按 library 过滤", async () => {
      const queryVec = randomVector(DIMENSION);

      const uiResults = await store.search(queryVec, 10, "@test/ui");
      for (const r of uiResults) {
        expect(r.library).toBe("@test/ui");
      }

      const utilsResults = await store.search(queryVec, 10, "@test/utils");
      for (const r of utilsResults) {
        expect(r.library).toBe("@test/utils");
      }
    });

    it("过滤不存在的 library 应返回空数组", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.search(queryVec, 5, "@nonexistent/lib");

      expect(results).toEqual([]);
    });

    it("结果的 similarity 应在 0-1 之间（Cosine）", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.search(queryVec, 5);

      for (const r of results) {
        expect(r.similarity).toBeGreaterThanOrEqual(0);
        expect(r.similarity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("关键词搜索", () => {
    it("应按文本匹配 name 字段", async () => {
      const results = await store.keywordSearch("comp-A", 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === "comp-A")).toBe(true);
    });

    it("应按文本匹配 content 字段", async () => {
      const results = await store.keywordSearch("Updated content", 5);

      expect(results.length).toBeGreaterThan(0);
      // comp-A 的 content 被 upsert 更新过为 "# Updated content"
      expect(results.some((r) => r.id === "comp-A")).toBe(true);
    });

    it("应支持 library 过滤", async () => {
      const results = await store.keywordSearch("Test", 10, "@test/utils");

      for (const r of results) {
        expect(r.library).toBe("@test/utils");
      }
    });

    it("无匹配时应返回空数组", async () => {
      const results = await store.keywordSearch("zzz_nonexistent_term_xyz", 5);

      expect(results).toEqual([]);
    });

    it("结果应包含完整的 payload 字段", async () => {
      const results = await store.keywordSearch("Test", 1);

      expect(results.length).toBe(1);
      const r = results[0];
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("library");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("content");
      expect(r).toHaveProperty("keywords");
      expect(r).toHaveProperty("example");
      expect(r).toHaveProperty("similarity");
    });
  });

  describe("混合搜索 (hybrid)", () => {
    it("应返回 top_k 个结果", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.hybridSearch(queryVec, "Test", 2);

      expect(results.length).toBeLessThanOrEqual(2);
      expect(results.length).toBeGreaterThan(0);
    });

    it("应融合向量和关键词结果", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.hybridSearch(queryVec, "comp-A", 5);

      // comp-A 应该同时被向量和关键词命中，排名靠前
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === "comp-A")).toBe(true);
    });

    it("应支持 library 过滤", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.hybridSearch(queryVec, "Test", 10, "@test/ui");

      for (const r of results) {
        expect(r.library).toBe("@test/ui");
      }
    });

    it("结果应包含 similarity 分数", async () => {
      const queryVec = randomVector(DIMENSION);
      const results = await store.hybridSearch(queryVec, "Test", 5);

      for (const r of results) {
        expect(typeof r.similarity).toBe("number");
        expect(r.similarity).toBeGreaterThan(0);
      }
    });

    it("纯关键词命中时也应有结果（即使向量无关）", async () => {
      // 用零向量，向量检索基本无意义，但关键词应仍能命中
      const zeroVec = Array.from({ length: DIMENSION }, () => 0.0001);
      const results = await store.hybridSearch(zeroVec, "func-C", 5);

      expect(results.some((r) => r.id === "func-C")).toBe(true);
    });
  });

  describe("清空数据", () => {
    it("deleteAll 后集合应为空", async () => {
      await store.deleteAll();
      const stats = await store.getStats();
      expect(stats.totalPoints).toBe(0);
    });
  });
});
