import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace structure", () => {
  it("contains required app folders", () => {
    expect(existsSync("apps/api")).toBe(true);
    expect(existsSync("apps/worker")).toBe(true);
    expect(existsSync("apps/web")).toBe(true);
  });
});

