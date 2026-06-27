import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/docker-e2e/**/*.{test,spec}.ts"],
    testTimeout: 300_000,
    hookTimeout: 120_000,
  },
});
