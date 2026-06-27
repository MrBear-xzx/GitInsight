export type CommitRecord = {
  author: string;
  timestamp: string;
};

export type MetricCard = {
  value: number;
  risk_level: "green" | "yellow" | "red";
};

export type QuickMetrics = {
  delivery_throughput: MetricCard;
  active_contributors: MetricCard;
  health_score: MetricCard;
};

export function calculateQuickMetrics(commits: CommitRecord[]): QuickMetrics {
  const contributorCount = new Set(commits.map((c) => c.author)).size;
  const throughput = commits.length;
  const healthScore = throughput > 0 ? 80 : 50;

  return {
    delivery_throughput: {
      value: throughput,
      risk_level: throughput > 0 ? "green" : "yellow"
    },
    active_contributors: {
      value: contributorCount,
      risk_level: contributorCount >= 2 ? "green" : "yellow"
    },
    health_score: {
      value: healthScore,
      risk_level: healthScore >= 75 ? "green" : "yellow"
    }
  };
}
