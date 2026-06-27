import { calculateQuickMetrics, CommitRecord } from "../src/metrics/quick-metrics.service";

describe("quick metrics", () => {
  it("calculates throughput and active contributors", () => {
    const sampleCommits: CommitRecord[] = [
      { author: "alice", timestamp: "2026-06-20T00:00:00Z" },
      { author: "bob", timestamp: "2026-06-20T01:00:00Z" },
      { author: "alice", timestamp: "2026-06-20T02:00:00Z" }
    ];

    const result = calculateQuickMetrics(sampleCommits);

    expect(result.delivery_throughput.value).toBeGreaterThan(0);
    expect(result.active_contributors.value).toBe(2);
    expect(result.health_score.value).toBeGreaterThan(0);
  });
});

