import { Inject, Injectable } from "@nestjs/common";
import { AnalysisJobStore } from "../analysis-jobs/analysis-job.store";
import { ANALYSIS_JOB_STORE_TOKEN } from "../analysis-jobs/analysis-job.store";

const FALLBACK_METRICS = [
  {
    metric_key: "delivery_throughput",
    display_name: "交付吞吐",
    value: 128,
    unit: "commits/week",
    trend_pct: 0.13,
    risk_level: "yellow",
    data_freshness: 45,
  },
  {
    metric_key: "active_contributors",
    display_name: "活跃贡献者数",
    value: 8,
    unit: "people",
    trend_pct: 0.1,
    risk_level: "green",
    data_freshness: 45,
  },
  {
    metric_key: "health_score",
    display_name: "项目健康分",
    value: 80,
    unit: "score",
    trend_pct: 0.05,
    risk_level: "green",
    data_freshness: 45,
  },
];

@Injectable()
export class DashboardService {
  constructor(
    @Inject(ANALYSIS_JOB_STORE_TOKEN)
    private readonly store: AnalysisJobStore
  ) {}

  async getDashboard(repoId: string, window: string) {
    const succeeded = await this.store.findLatestSucceeded(repoId, window);

    if (!succeeded || !succeeded.metrics_summary) {
      return {
        repo_id: repoId,
        window,
        snapshot_type: "quick",
        metrics: FALLBACK_METRICS,
      };
    }

    const summary = succeeded.metrics_summary;
    const metrics = [
      {
        metric_key: "delivery_throughput",
        display_name: "交付吞吐",
        value: summary.delivery_throughput ?? 0,
        unit: "commits/week",
        trend_pct: summary.delivery_throughput_trend ?? 0,
        risk_level: summary.delivery_throughput_risk ?? "green",
        data_freshness: 0,
      },
      {
        metric_key: "active_contributors",
        display_name: "活跃贡献者数",
        value: summary.active_contributors ?? 0,
        unit: "people",
        trend_pct: 0,
        risk_level: "green",
        data_freshness: 0,
      },
      {
        metric_key: "health_score",
        display_name: "项目健康分",
        value: summary.health_score ?? 0,
        unit: "score",
        trend_pct: 0,
        risk_level: "green",
        data_freshness: 0,
      },
    ];

    return {
      repo_id: repoId,
      window,
      snapshot_type: "quick",
      metrics,
    };
  }
}
