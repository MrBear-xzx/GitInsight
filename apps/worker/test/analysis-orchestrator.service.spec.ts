jest.mock("../src/services/git-clone.service");
jest.mock("../src/services/git-log-parser.service");
jest.mock("../src/metrics/metrics-calculator.service");

import { cloneRepo } from "../src/services/git-clone.service";
import { parseGitLog, CommitRecord } from "../src/services/git-log-parser.service";
import { calculateAllMetrics, MetricResult } from "../src/metrics/metrics-calculator.service";
import {
  runFullAnalysis,
  metricsToSummary,
} from "../src/orchestrators/analysis-orchestrator.service";

const mockCloneRepo = cloneRepo as jest.MockedFunction<typeof cloneRepo>;
const mockParseGitLog = parseGitLog as jest.MockedFunction<typeof parseGitLog>;
const mockCalcMetrics = calculateAllMetrics as jest.MockedFunction<
  typeof calculateAllMetrics
>;

describe("runFullAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("orchestrates clone -> parse -> calculate", async () => {
    mockCloneRepo.mockResolvedValue({
      repoPath: "/tmp/gitinsight-xxx",
      commitCount: 42,
      branch: "main",
    });

    const fakeCommits: CommitRecord[] = [
      {
        hash: "abc1234",
        author: "Alice",
        authorEmail: "alice@example.com",
        timestamp: "2026-06-20T10:00:00Z",
        message: "feat: x",
        files: ["src/a.ts"],
        additions: 1,
        deletions: 0,
      },
    ];

    mockParseGitLog.mockResolvedValue({
      commits: fakeCommits,
      totalCommits: 1,
      timeRange: { since: "2026-06-20T10:00:00Z", until: "2026-06-20T10:00:00Z" },
    });

    const fakeMetrics: MetricResult[] = [
      {
        metric_key: "delivery_throughput",
        display_name: "交付吞吐",
        value: 1,
        unit: "commits/week",
        trend_pct: 0,
        risk_level: "green",
        data_freshness: 0,
      },
    ];

    mockCalcMetrics.mockReturnValue(fakeMetrics);

    const result = await runFullAnalysis({
      repoUrl: "https://github.com/org/repo",
      timeWindow: "90d",
    });

    expect(mockCloneRepo).toHaveBeenCalledWith({
      repoUrl: "https://github.com/org/repo",
      pat: undefined,
      timeWindow: "90d",
    });
    expect(mockParseGitLog).toHaveBeenCalledWith({
      repoPath: "/tmp/gitinsight-xxx",
      timeWindow: "90d",
    });
    expect(mockCalcMetrics).toHaveBeenCalledWith(fakeCommits, "90d");

    expect(result.metrics).toEqual(fakeMetrics);
    expect(result.totalCommits).toBe(1);
    expect(result.branch).toBe("main");
    expect(result.commitCount).toBe(42);
    expect(result.repoPath).toBe("/tmp/gitinsight-xxx");
  });

  it("passes PAT to clone service", async () => {
    mockCloneRepo.mockResolvedValue({
      repoPath: "/tmp/gitinsight-xxx",
      commitCount: 10,
      branch: "main",
    });
    mockParseGitLog.mockResolvedValue({
      commits: [],
      totalCommits: 0,
      timeRange: { since: "", until: "" },
    });
    mockCalcMetrics.mockReturnValue([]);

    await runFullAnalysis({
      repoUrl: "https://github.com/org/repo",
      pat: "ghp_secret",
      timeWindow: "30d",
    });

    expect(mockCloneRepo).toHaveBeenCalledWith({
      repoUrl: "https://github.com/org/repo",
      pat: "ghp_secret",
      timeWindow: "30d",
    });
  });

  it("forwards clone errors", async () => {
    mockCloneRepo.mockRejectedValue({
      errorCode: "REPO_NOT_FOUND",
      errorMessage: "not found",
    });

    await expect(
      runFullAnalysis({
        repoUrl: "https://github.com/org/repo",
        timeWindow: "90d",
      })
    ).rejects.toMatchObject({
      errorCode: "REPO_NOT_FOUND",
    });
  });
});

describe("metricsToSummary", () => {
  it("converts metric results to flat record", () => {
    const metrics: MetricResult[] = [
      {
        metric_key: "delivery_throughput",
        display_name: "交付吞吐",
        value: 8.5,
        unit: "commits/week",
        trend_pct: 0.13,
        risk_level: "green",
        data_freshness: 0,
      },
    ];

    const summary = metricsToSummary(metrics);

    expect(summary.delivery_throughput).toBe(8.5);
    expect(summary.delivery_throughput_risk).toBe("green");
    expect(summary.delivery_throughput_trend).toBe(0.13);
    expect(summary.delivery_throughput_unit).toBe("commits/week");
  });

  it("returns empty object for empty array", () => {
    expect(metricsToSummary([])).toEqual({});
  });
});
