import { type AnalysisJobStatus } from "./analysis-job-status";

// Re-export for consumers that import from analysis-job.store
export type { AnalysisJobStatus };

export type AnalysisJobRecord = {
  job_id: string;
  repo_url: string;
  time_window: string;
  status: AnalysisJobStatus;
  progress: number;
  partial: boolean;
  metrics_summary: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  accepted_at: string;
  started_at: string | null;
  finished_at: string | null;
  updated_at: string;
};

export type CreateAnalysisJobInput = {
  repo_url: string;
  time_window: string;
  trigger_type: string;
};

export type UpdateAnalysisJobStatusInput = {
  job_id: string;
  status: AnalysisJobStatus;
  progress?: number;
  partial?: boolean;
  metrics_summary?: Record<string, unknown> | null;
  error_code?: string | null;
  error_message?: string | null;
};

export type ListAnalysisJobsInput = {
  limit?: number;
  offset?: number;
  status?: AnalysisJobStatus;
};

export interface AnalysisJobStore {
  create(input: CreateAnalysisJobInput): Promise<AnalysisJobRecord>;
  get(jobId: string): Promise<AnalysisJobRecord | undefined>;
  updateStatus(input: UpdateAnalysisJobStatusInput): Promise<AnalysisJobRecord | undefined>;
  findLatestSucceeded(repoUrl: string, timeWindow: string): Promise<AnalysisJobRecord | undefined>;
  list(input?: ListAnalysisJobsInput): Promise<AnalysisJobRecord[]>;
}
