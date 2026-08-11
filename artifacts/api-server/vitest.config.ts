import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Use the pool that supports ESM top-level await in test files
    pool: "forks",
  },
});
