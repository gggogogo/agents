import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 30_000, // Qdrant Cloud 可能延迟较高
    env: {
      // vitest 自动加载 .env
    },
  },
});
