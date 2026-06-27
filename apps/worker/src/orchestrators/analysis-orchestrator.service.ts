import { cloneRepo } from "../services/git-clone.service";
import { parseGitLog } from "../services/git-log-parser.service";
import { calculateAllMetrics, MetricResult } from "../metrics/metrics-calculator.service";

export type AnalysisInput = {
  repoUrl: string;
  pat?: string;
  timeWindow: string;
};

export type AnalysisOutput = {
  metrics: MetricResult[];
  totalCommits: number;
  branch: string;
  commitCount: number;
  repoPath?: string;
};

/**
 * Orchestrate the full analysis pipeline:
 * Clone -> Parse log -> Calculate metrics -> Return results.
 */
export async function runFullAnalysis(
  input: AnalysisInput
): Promise<AnalysisOutput> {
  // Step 1: Clone repository
  const cloneResult = await cloneRepo({
    repoUrl: input.repoUrl,
    pat: input.pat,
    timeWindow: input.timeWindow,
  });

  // Step 2: Parse git log
  const logResult = await parseGitLog({
    repoPath: cloneResult.repoPath,
    timeWindow: input.timeWindow,
  });

  // Step 3: Calculate metrics
  const metrics = calculateAllMetrics(logResult.commits, input.timeWindow);

  return {
    metrics,
    totalCommits: logResult.totalCommits,
    branch: cloneResult.branch,
    commitCount: cloneResult.commitCount,
    repoPath: cloneResult.repoPath,
  };
}

/**
 * Convert MetricResult[] to the metrics_summary format
 * expected by AnalysisJobRecord.metrics_summary.
 */
export function metricsToSummary(
  metrics: MetricResult[]
): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const m of metrics) {
    summary[m.metric_key] = m.value;
    summary[`${m.metric_key}_risk`] = m.risk_level;
    summary[`${m.metric_key}_trend`] = m.trend_pct;
    summary[`${m.metric_key}_unit`] = m.unit;
  }
  return summary;
}
