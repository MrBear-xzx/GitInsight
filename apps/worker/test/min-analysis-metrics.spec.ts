import { buildMinimalMetricsSummary } from "../src/processors/min-analysis-metrics";

describe("minimal analysis metrics", () => {
  it("builds summary from job payload", () => {
    const summary = buildMinimalMetricsSummary({
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
    });

    expect(summary).toEqual({
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
      commits_scanned: 0,
      contributors_detected: 0,
      generated_by: "minimal-worker",
    });
  });
});
