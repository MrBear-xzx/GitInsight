import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("docker compose config", () => {
  it("contains postgres redis api worker services", () => {
    const compose = readFileSync("docker-compose.yml", "utf-8");
    expect(compose).toContain("postgres:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("api:");
    expect(compose).toContain("worker:");
  });
});
