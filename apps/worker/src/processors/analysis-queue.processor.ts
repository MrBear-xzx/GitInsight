import { runFullAnalysis, metricsToSummary } from "../orchestrators/analysis-orchestrator.service";
import type { AnalysisJobStatus } from "../../../api/src/modules/analysis-jobs/analysis-job-status";

// ── Port types ─────────────────────────────────────────

type AnalysisJobStatusInput = {
  job_id: string;
  status: AnalysisJobStatus;
  progress?: number;
  metrics_summary?: Record<string, unknown>;
  error_code?: string | null;
  error_message?: string | null;
};

type AnalysisJobStorePort = {
  updateStatus(input: AnalysisJobStatusInput): Promise<unknown>;
};

type ProcessAnalysisJobInput = {
  store: AnalysisJobStorePort;
  jobId: string;
  shouldFail: boolean;
  payload?: {
    repo_url: string;
    time_window: string;
    trigger_type: string;
  };
  attempt?: number;
  maxAttempts?: number;
};

// ── Constants ──────────────────────────────────────────

const ERROR_CODE_MAP: Record<string, string> = {
  REPO_NOT_FOUND: "REPO_NOT_FOUND",
  AUTH_INVALID_PAT: "AUTH_INVALID_PAT",
  GITHUB_RATE_LIMITED: "GITHUB_RATE_LIMITED",
  CLONE_FAILED: "CLONE_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

// ── Main processor ─────────────────────────────────────

export async function processAnalysisJob(
  input: ProcessAnalysisJobInput
): Promise<void> {
  const { store, jobId, shouldFail } = input;
  const attempt = input.attempt ?? 1;
  const maxAttempts = input.maxAttempts ?? 1;
  const payload = input.payload;

  try {
    await store.updateStatus({ job_id: jobId, status: "RUNNING_QUICK" });

    if (!payload) {
      // Legacy path: no payload, just simulate
      await store.updateStatus({ job_id: jobId, status: "QUICK_DONE" });
      await store.updateStatus({ job_id: jobId, status: "RUNNING_DEEP" });

      if (shouldFail) {
        throw new Error("simulated queue failure");
      }

      await store.updateStatus({ job_id: jobId, status: "SUCCEEDED" });
      return;
    }

    // Real analysis pipeline
    const analysisResult = await runFullAnalysis({
      repoUrl: payload.repo_url,
      timeWindow: payload.time_window,
    });

    await store.updateStatus({
      job_id: jobId,
      status: "QUICK_DONE",
      progress: 50,
    });

    await store.updateStatus({
      job_id: jobId,
      status: "RUNNING_DEEP",
      progress: 75,
    });

    if (shouldFail) {
      throw new Error("simulated queue failure");
    }

    // Write metrics and complete
    const metricsSummary = metricsToSummary(analysisResult.metrics);
    await store.updateStatus({
      job_id: jobId,
      status: "SUCCEEDED",
      metrics_summary: metricsSummary,
    });
  } catch (error) {
    const err = error as Error & { errorCode?: string };
    const errorCode = err.errorCode ?? "INTERNAL_ERROR";
    const mappedCode = ERROR_CODE_MAP[errorCode] ?? "INTERNAL_ERROR";

    const isLastAttempt = attempt >= maxAttempts;
    const finalStatus = isLastAttempt ? "FAILED_FINAL" : "FAILED_RETRYABLE";

    await store.updateStatus({
      job_id: jobId,
      status: finalStatus,
      error_code: mappedCode,
      error_message: err.message ?? "unexpected queue failure",
    });

    if (isLastAttempt) {
      throw error;
    }
  }
}
