import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AnalysisJobRecord,
  AnalysisJobStatus,
  AnalysisJobStore,
  CreateAnalysisJobInput,
  ListAnalysisJobsInput,
  UpdateAnalysisJobStatusInput,
} from "./analysis-job.store";

@Injectable()
export class InMemoryAnalysisJobStore implements AnalysisJobStore {
  private readonly jobs = new Map<string, AnalysisJobRecord>();

  async create(input: CreateAnalysisJobInput): Promise<AnalysisJobRecord> {
    const now = new Date().toISOString();
    const record: AnalysisJobRecord = {
      job_id: randomUUID(),
      repo_url: input.repo_url,
      time_window: input.time_window,
      status: "PENDING",
      progress: 0,
      partial: false,
      metrics_summary: null,
      error_code: null,
      error_message: null,
      accepted_at: now,
      started_at: null,
      finished_at: null,
      updated_at: now,
    };
    this.jobs.set(record.job_id, record);
    return record;
  }

  async get(jobId: string): Promise<AnalysisJobRecord | undefined> {
    return this.jobs.get(jobId);
  }

  async updateStatus(
    input: UpdateAnalysisJobStatusInput
  ): Promise<AnalysisJobRecord | undefined> {
    const current = this.jobs.get(input.job_id);
    if (!current) {
      return undefined;
    }

    const now = new Date().toISOString();
    const nextStatus = input.status;
    const next: AnalysisJobRecord = {
      ...current,
      status: nextStatus,
      progress: input.progress ?? this.defaultProgressFor(nextStatus),
      partial: input.partial ?? current.partial,
      metrics_summary:
        input.metrics_summary !== undefined
          ? input.metrics_summary
          : current.metrics_summary,
      error_code: input.error_code ?? current.error_code,
      error_message: input.error_message ?? current.error_message,
      started_at:
        current.started_at ??
        (nextStatus === "RUNNING_QUICK" ? now : current.started_at),
      finished_at:
        nextStatus === "SUCCEEDED" || nextStatus === "FAILED_FINAL"
          ? now
          : current.finished_at,
      updated_at: now,
    };

    this.jobs.set(input.job_id, next);
    return next;
  }

  async findLatestSucceeded(
    repoUrl: string,
    timeWindow: string
  ): Promise<AnalysisJobRecord | undefined> {
    const candidates: AnalysisJobRecord[] = [];
    for (const job of this.jobs.values()) {
      if (
        job.repo_url === repoUrl &&
        job.time_window === timeWindow &&
        job.status === "SUCCEEDED" &&
        job.metrics_summary != null
      ) {
        candidates.push(job);
      }
    }
    if (candidates.length === 0) return undefined;
    candidates.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return candidates[0];
  }

  async list(input?: ListAnalysisJobsInput): Promise<AnalysisJobRecord[]> {
    let jobs = [...this.jobs.values()];

    if (input?.status) {
      jobs = jobs.filter((j) => j.status === input.status);
    }

    jobs.sort(
      (a, b) =>
        new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime()
    );

    const offset = input?.offset ?? 0;
    const limit = input?.limit ?? 50;
    return jobs.slice(offset, offset + limit);
  }

  private defaultProgressFor(status: AnalysisJobStatus): number {
    if (status === "PENDING") return 0;
    if (status === "RUNNING_QUICK") return 25;
    if (status === "QUICK_DONE") return 50;
    if (status === "RUNNING_DEEP") return 75;
    if (status === "SUCCEEDED") return 100;
    return 0;
  }
}
