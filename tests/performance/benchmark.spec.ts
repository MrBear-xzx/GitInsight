import { describe, it, expect } from "vitest";
import { calculateAllMetrics } from "../../apps/worker/src/metrics/metrics-calculator.service";
import type { CommitRecord } from "../../apps/worker/src/services/git-log-parser.service";

// ── 辅助：生成 N 条模拟提交 ──────────────────────────

function generateCommits(count: number): CommitRecord[] {
  const authors = ["alice", "bob", "charlie", "dave", "eve"];
  const now = Date.now();
  const commits: CommitRecord[] = [];
  for (let i = 0; i < count; i++) {
    const author = authors[i % authors.length];
    commits.push({
      hash: `a${i.toString(16).padStart(40, "0")}`,
      author,
      authorEmail: `${author}@example.com`,
      timestamp: new Date(now - i * 3600_000).toISOString(),
      message: `feat: commit #${i}`,
      files: [`src/file${i % 10}.ts`],
      additions: Math.floor(Math.random() * 50) + 1,
      deletions: Math.floor(Math.random() * 20),
    });
  }
  return commits;
}

// ── 快速层（< 60s） ──────────────────────────────────

describe("benchmark: metrics calculation (quick layer)", () => {
  it("should calculate 9 metrics for 100 commits within 100ms", () => {
    const commits = generateCommits(100);
    const start = performance.now();
    const metrics = calculateAllMetrics(commits, "90d");
    const elapsed = performance.now() - start;
    expect(metrics).toHaveLength(9);
    expect(elapsed).toBeLessThan(100);
  });

  it("should calculate 9 metrics for 1000 commits within 500ms", () => {
    const commits = generateCommits(1000);
    const start = performance.now();
    const metrics = calculateAllMetrics(commits, "90d");
    const elapsed = performance.now() - start;
    expect(metrics).toHaveLength(9);
    expect(elapsed).toBeLessThan(500);
  });
});

// ── 深层层（< 10min P90） ────────────────────────────

describe("benchmark: metrics calculation (deep layer)", () => {
  it("should handle 10000 commits within 5s", () => {
    const commits = generateCommits(10000);
    const start = performance.now();
    const metrics = calculateAllMetrics(commits, "90d");
    const elapsed = performance.now() - start;
    expect(metrics).toHaveLength(9);
    expect(elapsed).toBeLessThan(5000);
  });
});
