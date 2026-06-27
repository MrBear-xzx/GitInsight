import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("root vitest scope", () => {
  it("limits root vitest discovery to smoke + performance tests only", () => {
    const configPath = "vitest.config.ts";
    expect(existsSync(configPath)).toBe(true);
    const configContent = readFileSync(configPath, "utf8");
    expect(configContent).toContain("tests/smoke/**/*.{test,spec}.ts");
    expect(configContent).toContain("tests/performance/**/*.{test,spec}.ts");
    expect(configContent).toContain('exclude: ["apps/**/test/**"]');
  });
});
