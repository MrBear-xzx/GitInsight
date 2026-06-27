type AnalysisJobPayload = {
  repo_url: string;
  time_window: string;
  trigger_type: string;
};

export function buildMinimalMetricsSummary(payload: AnalysisJobPayload) {
  return {
    repo_url: payload.repo_url,
    time_window: payload.time_window,
    trigger_type: payload.trigger_type,
    commits_scanned: 0,
    contributors_detected: 0,
    generated_by: "minimal-worker",
  };
}
