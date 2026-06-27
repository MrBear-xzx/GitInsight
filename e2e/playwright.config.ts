import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
  projects: [
    {
      name: "api",
      testMatch: "*.e2e.pw.ts",
    },
    {
      name: "ui",
      testMatch: "pages/*.spec.ts",
      use: {
        baseURL: "http://127.0.0.1:3001",
      },
    },
  ],
});
