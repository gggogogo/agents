#!/usr/bin/env tsx
/**
 * CLI tool for indexing SDK documentation.
 *
 * Usage:
 *   pnpm index -- --docs-dir ./docs
 *   pnpm index -- --docs-dir ./docs --force
 */

import { Command } from "commander";
import { settings, validateSettings } from "../config/settings.js";
import { DocumentLoader } from "../ingestion/parser.js";
import { EmbeddingGenerator } from "../embeddings/embedder.js";
import { VectorStore } from "../storage/vector-store.js";

const program = new Command();

program
  .name("index-docs")
  .description("Index SDK documentation into vector database")
  .option("-d, --docs-dir <path>", "Documentation directory", "./docs")
  .option("-f, --force", "Force reindex (delete existing data)", false)
  .option("-v, --verbose", "Verbose logging", false)
  .action(async (opts: { docsDir: string; force: boolean; verbose: boolean }) => {
    try {
      // Validate settings
      validateSettings();

      // Initialize services
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

      // Force mode: wipe everything and full reindex
      if (opts.force) {
        console.warn("⚠️  Force reindex: deleting existing data");
        await vectorStore.deleteAll();
      }

      // 1. Load documentation
      console.log(`📄 Loading docs from ${opts.docsDir}`);
      const loader = new DocumentLoader(opts.docsDir);
      const allChunks = loader.loadAll();
      console.log(`✓ Loaded ${allChunks.length} documents\n`);

      if (allChunks.length === 0) {
        console.warn("⚠️  No documents found!");
        return;
      }

      // 2. Incremental diff: compare content hashes
      const existingHashes = opts.force
        ? new Map<string, string>()
        : await vectorStore.getExistingHashes();

      const currentIds = new Set(allChunks.map((c) => c.id));

      const added: typeof allChunks = [];
      const changed: typeof allChunks = [];
      const unchanged: string[] = [];
      const deleted: string[] = [];

      for (const chunk of allChunks) {
        const oldHash = existingHashes.get(chunk.id);
        if (!oldHash) {
          added.push(chunk);
        } else if (oldHash !== chunk.contentHash) {
          changed.push(chunk);
        } else {
          unchanged.push(chunk.id);
        }
      }

      for (const existingId of existingHashes.keys()) {
        if (!currentIds.has(existingId)) {
          deleted.push(existingId);
        }
      }

      console.log(`📊 Diff: +${added.length} added, ~${changed.length} changed, =${unchanged.length} unchanged, -${deleted.length} deleted\n`);

      // 3. Delete removed docs
      if (deleted.length > 0) {
        console.log(`🗑️  Deleting ${deleted.length} removed docs...`);
        await vectorStore.deleteByChunkIds(deleted);
      }

      // 4. Embed and upsert only new/changed docs
      const toProcess = [...added, ...changed];

      if (toProcess.length === 0) {
        console.log("✅ No changes detected, skipping embedding.\n");
      } else {
        console.log(`🔢 Generating embeddings for ${toProcess.length} docs...`);
        const embeddedChunks = await embedder.embedChunks(toProcess);
        console.log("✓ Embeddings generated\n");

        console.log("💾 Storing in Qdrant...");
        await vectorStore.insertChunks(embeddedChunks);
        console.log("✓ Indexing complete!\n");
      }

      // 5. Print stats
      const stats = await vectorStore.getStats();
      const libraries = new Set(allChunks.map((c) => c.library));

      console.log("📊 Indexing Summary:");
      console.log(`  - Total documents: ${allChunks.length}`);
      console.log(`  - Processed: ${toProcess.length} (${added.length} new, ${changed.length} updated)`);
      console.log(`  - Skipped: ${unchanged.length} (unchanged)`);
      console.log(`  - Deleted: ${deleted.length}`);
      console.log(`  - Libraries: ${libraries.size}`);
      console.log(`  - Total points in DB: ${stats.totalPoints}`);
      console.log(`  - Vector size: ${stats.vectorSize}`);
    } catch (err) {
      console.error("❌ Indexing failed:", err);
      process.exit(1);
    }
  });

program.parse();
