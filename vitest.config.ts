import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/smoke/**/*.{test,spec}.ts",
      "tests/performance/**/*.{test,spec}.ts",
    ],
    exclude: ["apps/**/test/**"],
  },
});
