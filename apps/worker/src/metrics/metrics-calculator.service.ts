import { CommitRecord } from "../services/git-log-parser.service";

// ── 输出类型 ──────────────────────────────────────────

export type MetricResult = {
  metric_key: string;
  display_name: string;
  value: number;
  unit: string;
  trend_pct: number;
  risk_level: "green" | "yellow" | "red";
  data_freshness: number;
};

// ── 主入口 ────────────────────────────────────────────

/**
 * Calculate all 9 dashboard metrics from parsed git log records.
 */
export function calculateAllMetrics(
  commits: CommitRecord[],
  _timeWindow: string
): MetricResult[] {
  if (commits.length === 0) {
    return buildEmptyMetrics();
  }

  const weeks = Math.max(1, calculateWeeks(commits));

  // Pre-compute derived data
  const authorCounts = countByAuthor(commits);
  const totalCommits = commits.length;
  const totalAuthors = authorCounts.size;
  const sortedAuthors = [...authorCounts.entries()].sort((a, b) => b[1] - a[1]);
  const fileChangeCounts = countFileChanges(commits);

  // 1. 交付吞吐
  const throughput = totalCommits / weeks;
  const throughputRisk = riskForValue(throughput, 5, 20, true);

  // 2. Lead Time Proxy (首次到最后提交时间跨度 / 2，近似中位)
  const leadTimeHours = estimateLeadTimeHours(commits);
  const leadTimeRisk = riskForValue(leadTimeHours, 48, 12, true);

  // 3. Review Response Time (提交间隔中位时间)
  const reviewResponseHours = estimateReviewResponseHours(commits);

  // 4. Review Completion Time (同窗口近似)
  const reviewCompleteHours = leadTimeHours;

  // 5. 活跃贡献者 (提交次数 >= 5)
  const activeContributors = [...authorCounts.values()].filter((c) => c >= 5).length;
  const activeRisk =
    totalAuthors === 0
      ? "red"
      : activeContributors / totalAuthors >= 0.5
        ? "green"
        : activeContributors >= 2
          ? "yellow"
          : "red";

  // 6. Bus Factor Risk (Top 2 占比)
  const top2Commits = sortedAuthors.slice(0, 2).reduce((sum, [, c]) => sum + c, 0);
  const top2Ratio = totalCommits > 0 ? (top2Commits / totalCommits) * 100 : 0;
  const busFactorRisk =
    top2Ratio >= 80 ? "red" : top2Ratio >= 50 ? "yellow" : "green";

  // 7. Hotspot Volatility (高频文件热度 0-100)
  const hotspotScore = calculateHotspotScore(fileChangeCounts, totalCommits);

  // 8. Rework Ratio (修改已有文件的提交占比)
  const reworkRatio = calculateReworkRatio(commits, fileChangeCounts);
  const reworkRisk =
    reworkRatio >= 0.5 ? "red" : reworkRatio >= 0.25 ? "yellow" : "green";

  // 9. Health Score (前 8 归一化加权)
  const healthScore = calculateHealthScore({
    throughput,
    leadTimeHours,
    reviewResponseHours,
    reviewCompleteHours,
    activeContributors,
    totalAuthors,
    top2Ratio,
    hotspotScore,
    reworkRatio,
  });

  return [
    {
      metric_key: "delivery_throughput",
      display_name: "交付吞吐",
      value: Math.round(throughput * 10) / 10,
      unit: "commits/week",
      trend_pct: 0,
      risk_level: throughputRisk,
      data_freshness: 0,
    },
    {
      metric_key: "lead_time_proxy",
      display_name: "交付周期",
      value: Math.round(leadTimeHours * 10) / 10,
      unit: "hours",
      trend_pct: 0,
      risk_level: leadTimeRisk,
      data_freshness: 0,
    },
    {
      metric_key: "review_response_time",
      display_name: "首次评审响应",
      value: Math.round(reviewResponseHours * 10) / 10,
      unit: "hours",
      trend_pct: 0,
      risk_level: riskForValue(reviewResponseHours, 24, 8, true),
      data_freshness: 0,
    },
    {
      metric_key: "review_completion_time",
      display_name: "评审完成时间",
      value: Math.round(reviewCompleteHours * 10) / 10,
      unit: "hours",
      trend_pct: 0,
      risk_level: riskForValue(reviewCompleteHours, 72, 24, true),
      data_freshness: 0,
    },
    {
      metric_key: "active_contributors",
      display_name: "活跃贡献者",
      value: activeContributors,
      unit: "people",
      trend_pct: 0,
      risk_level: activeRisk,
      data_freshness: 0,
    },
    {
      metric_key: "bus_factor_risk",
      display_name: "Bus Factor 风险",
      value: Math.round(top2Ratio),
      unit: "%",
      trend_pct: 0,
      risk_level: busFactorRisk,
      data_freshness: 0,
    },
    {
      metric_key: "hotspot_volatility",
      display_name: "热点波动",
      value: Math.round(hotspotScore),
      unit: "score",
      trend_pct: 0,
      risk_level: riskForValue(hotspotScore, 70, 40, true),
      data_freshness: 0,
    },
    {
      metric_key: "rework_ratio",
      display_name: "返工率",
      value: Math.round(reworkRatio * 100),
      unit: "%",
      trend_pct: 0,
      risk_level: reworkRisk,
      data_freshness: 0,
    },
    {
      metric_key: "health_score",
      display_name: "项目健康分",
      value: Math.round(healthScore),
      unit: "score",
      trend_pct: 0,
      risk_level:
        healthScore >= 75 ? "green" : healthScore >= 45 ? "yellow" : "red",
      data_freshness: 0,
    },
  ];
}

// ── 内部辅助函数 ──────────────────────────────────────

function buildEmptyMetrics(): MetricResult[] {
  const keys = [
    ["delivery_throughput", "交付吞吐", "commits/week"],
    ["lead_time_proxy", "交付周期", "hours"],
    ["review_response_time", "首次评审响应", "hours"],
    ["review_completion_time", "评审完成时间", "hours"],
    ["active_contributors", "活跃贡献者", "people"],
    ["bus_factor_risk", "Bus Factor 风险", "%"],
    ["hotspot_volatility", "热点波动", "score"],
    ["rework_ratio", "返工率", "%"],
    ["health_score", "项目健康分", "score"],
  ];
  return keys.map(([key, name, unit]) => ({
    metric_key: key,
    display_name: name,
    value: 0,
    unit,
    trend_pct: 0,
    risk_level: "red" as const,
    data_freshness: 0,
  }));
}

function calculateWeeks(commits: CommitRecord[]): number {
  const timestamps = commits.map((c) => new Date(c.timestamp).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const diffMs = max - min;
  return diffMs / (7 * 24 * 3600 * 1000) || 1;
}

function countByAuthor(commits: CommitRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of commits) {
    counts.set(c.author, (counts.get(c.author) || 0) + 1);
  }
  return counts;
}

function countFileChanges(commits: CommitRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of commits) {
    for (const f of c.files) {
      counts.set(f, (counts.get(f) || 0) + 1);
    }
  }
  return counts;
}

function estimateLeadTimeHours(commits: CommitRecord[]): number {
  const timestamps = commits.map((c) => new Date(c.timestamp).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return (max - min) / (3600 * 1000) / 2; // 近似中位
}

function estimateReviewResponseHours(commits: CommitRecord[]): number {
  // 按作者分组后计算提交间隔中位
  const sorted = [...commits].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  if (sorted.length < 2) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i].timestamp).getTime() -
        new Date(sorted[i - 1].timestamp).getTime()) /
      (3600 * 1000);
    if (diff > 0 && diff < 720) {
      // 忽略超过30天的间隔
      intervals.push(diff);
    }
  }
  if (intervals.length === 0) return 0;
  intervals.sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  return intervals.length % 2 === 0
    ? (intervals[mid - 1] + intervals[mid]) / 2
    : intervals[mid];
}

function calculateHotspotScore(
  fileCounts: Map<string, number>,
  totalCommits: number
): number {
  if (totalCommits === 0) return 0;
  let score = 0;
  for (const count of fileCounts.values()) {
    const ratio = count / totalCommits;
    if (ratio > 0.3) score += 30;
    else if (ratio > 0.15) score += 15;
    else if (ratio > 0.05) score += 5;
  }
  return Math.min(100, score);
}

function calculateReworkRatio(
  commits: CommitRecord[],
  fileCounts: Map<string, number>
): number {
  if (commits.length === 0) return 0;
  let reworkCommits = 0;
  for (const c of commits) {
    const hasRework = c.files.some((f) => (fileCounts.get(f) || 0) > 1);
    if (hasRework) reworkCommits++;
  }
  return reworkCommits / commits.length;
}

type HealthInput = {
  throughput: number;
  leadTimeHours: number;
  reviewResponseHours: number;
  reviewCompleteHours: number;
  activeContributors: number;
  totalAuthors: number;
  top2Ratio: number;
  hotspotScore: number;
  reworkRatio: number;
};

function calculateHealthScore(input: HealthInput): number {
  // 每个指标归一化到 0-100，加权平均
  const scores: number[] = [];

  // throughput: >=20 每周 = 100, <=1 = 0
  scores.push(normalize(input.throughput, 1, 20) * 0.2);

  // lead time: <=12h = 100, >=168h(1周) = 0
  scores.push((1 - normalize(input.leadTimeHours, 12, 168)) * 0.15);

  // review response: <=4h = 100, >=48h = 0
  scores.push((1 - normalize(input.reviewResponseHours, 4, 48)) * 0.1);

  // review complete: <=24h = 100, >=168h = 0
  scores.push((1 - normalize(input.reviewCompleteHours, 24, 168)) * 0.1);

  // active contributors ratio
  const activeRatio =
    input.totalAuthors > 0 ? input.activeContributors / input.totalAuthors : 0;
  scores.push(normalize(activeRatio, 0, 0.5) * 0.1);

  // bus factor: top2 <=30% = 100, >=80% = 0
  scores.push((1 - normalize(input.top2Ratio, 30, 80) / 100) * 0.15);

  // hotspot: <=20 = 100, >=70 = 0
  scores.push((1 - normalize(input.hotspotScore, 20, 70) / 100) * 0.05);

  // rework: <=10% = 100, >=50% = 0
  scores.push((1 - normalize(input.reworkRatio, 0.1, 0.5)) * 0.05);

  // bonus: contributor diversity
  scores.push(normalize(input.totalAuthors, 1, 10) * 0.1);

  const total = scores.reduce((sum, s) => sum + s, 0);
  return Math.round(Math.min(100, Math.max(0, total * 100)));
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}

function riskForValue(
  value: number,
  redThreshold: number,
  yellowThreshold: number,
  higherIsBetter: boolean
): "green" | "yellow" | "red" {
  if (higherIsBetter) {
    if (value >= redThreshold) return "green";
    if (value >= yellowThreshold) return "yellow";
    return "red";
  }
  if (value <= redThreshold) return "green";
  if (value <= yellowThreshold) return "yellow";
  return "red";
}
