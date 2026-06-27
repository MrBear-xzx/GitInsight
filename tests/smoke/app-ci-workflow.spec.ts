import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("app ci workflow", () => {
  it("includes unit and integration jobs", () => {
    const workflow = readFileSync(".github/workflows/app-ci.yml", "utf-8");
    expect(workflow).toContain("unit-test:");
    expect(workflow).toContain("integration-test:");
  });
});
