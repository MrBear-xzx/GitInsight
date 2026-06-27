const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000";

export type CreateJobInput = {
  repo_url: string;
  pat?: string;
  time_window: string;
  trigger_type: string;
};

export type AnalysisJob = {
  job_id: string;
  repo_url: string;
  time_window: string;
  status: string;
  progress: number;
  partial: boolean;
  error_code: string | null;
  error_message: string | null;
  accepted_at: string;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
};

export type MetricItem = {
  metric_key: string;
  display_name: string;
  value: number;
  unit: string;
  trend_pct: number;
  risk_level: "green" | "yellow" | "red";
  data_freshness: number;
};

export type DashboardData = {
  repo_id: string;
  window: string;
  snapshot_type: string;
  metrics: MetricItem[];
};

export async function createAnalysisJob(
  input: CreateJobInput
): Promise<AnalysisJob> {
  const res = await fetch(`${API_BASE}/api/v1/analysis-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`创建分析任务失败: ${res.status} ${err}`);
  }
  return res.json();
}

export async function getAnalysisJob(
  jobId: string
): Promise<AnalysisJob> {
  const res = await fetch(`${API_BASE}/api/v1/analysis-jobs/${jobId}`);
  if (!res.ok) {
    throw new Error(`查询任务失败: ${res.status}`);
  }
  return res.json();
}

export async function listAnalysisJobs(): Promise<AnalysisJob[]> {
  const res = await fetch(`${API_BASE}/api/v1/analysis-jobs`);
  if (!res.ok) {
    throw new Error(`获取任务列表失败: ${res.status}`);
  }
  return res.json();
}

export async function getDashboard(
  repoId: string,
  window: string
): Promise<DashboardData> {
  const res = await fetch(
    `${API_BASE}/api/v1/dashboard?repo_id=${encodeURIComponent(repoId)}&window=${encodeURIComponent(window)}`
  );
  if (!res.ok) {
    throw new Error(`读取看板失败: ${res.status}`);
  }
  return res.json();
}
