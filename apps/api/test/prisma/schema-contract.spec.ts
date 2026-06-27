import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Prisma schema contract", () => {
  it("contains required models and status field", () => {
    const schemaPath = resolve(process.cwd(), "../../prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf-8");
    expect(schema).toContain("model Repository");
    expect(schema).toContain("model AnalysisJob");
    expect(schema).toContain("status");
    expect(schema).toContain("startedAt");
    expect(schema).toContain("finishedAt");
    expect(schema).toContain("updatedAt");
    expect(schema).toContain("errorMessage");
  });
});
