import { CommitRecord } from "../src/services/git-log-parser.service";
import { calculateAllMetrics } from "../src/metrics/metrics-calculator.service";

describe("calculateAllMetrics", () => {
  const makeCommit = (
    hash: string,
    author: string,
    timestamp: string,
    files: string[],
    additions = 1,
    deletions = 0
  ): CommitRecord => ({
    hash,
    author,
    authorEmail: `${author}@example.com`,
    timestamp,
    message: "commit " + hash,
    files,
    additions,
    deletions,
  });

  const alice = "alice@example.com";
  const bob = "bob@example.com";
  const carol = "carol@example.com";

  it("calculates all 9 metrics with sample data", () => {
    const commits: CommitRecord[] = [
      makeCommit("a1", alice, "2026-06-20T10:00:00Z", ["src/a.ts"], 10, 2),
      makeCommit("a2", alice, "2026-06-19T10:00:00Z", ["src/a.ts", "src/b.ts"], 5, 1),
      makeCommit("a3", alice, "2026-06-18T10:00:00Z", ["src/c.ts"], 3, 0),
      makeCommit("a4", alice, "2026-06-17T10:00:00Z", ["src/a.ts"], 8, 3),
      makeCommit("a5", alice, "2026-06-16T10:00:00Z", ["src/d.ts"], 2, 1),
      makeCommit("b1", bob, "2026-06-15T10:00:00Z", ["src/e.ts"], 1, 0),
      makeCommit("b2", bob, "2026-06-14T10:00:00Z", ["src/a.ts"], 4, 2),
      makeCommit("c1", carol, "2026-06-13T10:00:00Z", ["src/f.ts"], 6, 0),
    ];

    const result = calculateAllMetrics(commits, "90d");

    expect(result).toHaveLength(9);

    // Check metric keys
    const keys = result.map((m) => m.metric_key);
    expect(keys).toEqual([
      "delivery_throughput",
      "lead_time_proxy",
      "review_response_time",
      "review_completion_time",
      "active_contributors",
      "bus_factor_risk",
      "hotspot_volatility",
      "rework_ratio",
      "health_score",
    ]);

    // delivery_throughput: 8 commits over ~7 days = ~8/week
    const throughput = result.find((m) => m.metric_key === "delivery_throughput")!;
    expect(throughput.value).toBeGreaterThan(0);
    expect(throughput.unit).toBe("commits/week");

    // active_contributors: 3 contributors, only alice has >=5 commits
    const active = result.find((m) => m.metric_key === "active_contributors")!;
    expect(active.value).toBe(1); // Only alice has 5 commits

    // bus_factor_risk: top 2 = alice(5) + bob(2) = 7/8 = 87.5%
    const busFactor = result.find((m) => m.metric_key === "bus_factor_risk")!;
    expect(busFactor.value).toBeGreaterThan(50);

    // rework_ratio: commits modifying existing files = a1(modified a.ts from a2), a2(modified a.ts+b.ts), a4(modified a.ts), b2(modified a.ts) = 4
    // total commits = 8
    const rework = result.find((m) => m.metric_key === "rework_ratio")!;
    expect(rework.value).toBeGreaterThan(0);

    // health_score: should be between 0-100
    const health = result.find((m) => m.metric_key === "health_score")!;
    expect(health.value).toBeGreaterThanOrEqual(0);
    expect(health.value).toBeLessThanOrEqual(100);
  });

  it("handles empty commit list", () => {
    const result = calculateAllMetrics([], "90d");

    const throughput = result.find((m) => m.metric_key === "delivery_throughput")!;
    expect(throughput.value).toBe(0);
    expect(throughput.risk_level).toBe("red");

    const health = result.find((m) => m.metric_key === "health_score")!;
    expect(health.value).toBe(0);
    expect(health.risk_level).toBe("red");
  });

  it("handles single contributor", () => {
    const commits: CommitRecord[] = [
      makeCommit("a1", alice, "2026-06-20T10:00:00Z", ["src/a.ts"]),
    ];

    const result = calculateAllMetrics(commits, "90d");

    const active = result.find((m) => m.metric_key === "active_contributors")!;
    expect(active.value).toBe(0); // Only 1 commit, threshold is 5

    const busFactor = result.find((m) => m.metric_key === "bus_factor_risk")!;
    expect(busFactor.value).toBe(100); // 100% concentration
    expect(busFactor.risk_level).toBe("red");
  });

  it("assigns risk_level correctly", () => {
    const commits: CommitRecord[] = [
      makeCommit("a1", alice, "2026-06-20T10:00:00Z", ["src/a.ts"]),
      makeCommit("a2", bob, "2026-06-19T10:00:00Z", ["src/b.ts"]),
      makeCommit("a3", carol, "2026-06-18T10:00:00Z", ["src/c.ts"]),
    ];

    const result = calculateAllMetrics(commits, "30d");

    const keys = result.map((m) => m.metric_key);
    expect(keys).toHaveLength(9);
    result.forEach((m) => {
      expect(["green", "yellow", "red"]).toContain(m.risk_level);
      expect(typeof m.value).toBe("number");
      expect(m.unit).toBeDefined();
      expect(m.display_name).toBeDefined();
    });
  });
});
