import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace structure", () => {
  it("contains required app and package folders", () => {
    expect(existsSync("apps/api")).toBe(true);
    expect(existsSync("apps/worker")).toBe(true);
    expect(existsSync("apps/web")).toBe(true);
    expect(existsSync("packages/shared")).toBe(true);
    expect(existsSync("packages/config")).toBe(true);
  });
});

