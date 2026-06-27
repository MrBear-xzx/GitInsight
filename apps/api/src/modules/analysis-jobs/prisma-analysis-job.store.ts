import { Injectable } from "@nestjs/common";
import {
  AnalysisJobRecord,
  AnalysisJobStatus,
  AnalysisJobStore,
  CreateAnalysisJobInput,
  ListAnalysisJobsInput, UpdateAnalysisJobStatusInput,
} from "./analysis-job.store";
import { PrismaJobRecord, PrismaLikeClient } from "./prisma-job-store.types";

@Injectable()
export class PrismaAnalysisJobStore implements AnalysisJobStore {
  constructor(private readonly prisma: PrismaLikeClient) {}

  async create(input: CreateAnalysisJobInput): Promise<AnalysisJobRecord> {
    const repository = await this.ensureRepository(input.repo_url);
    const created = await this.prisma.analysisJob.create({
      data: {
        repoId: repository.id,
        status: "PENDING",
        progress: 0,
        triggerType: input.trigger_type,
        timeWindow: input.time_window,
        partial: false,
      },
      include: {
        repository: {
          select: {
            repoUrl: true,
          },
        },
      },
    });

    return this.toRecord(created);
  }

  async get(jobId: string): Promise<AnalysisJobRecord | undefined> {
    const job = await this.prisma.analysisJob.findUnique({
      where: { id: jobId },
      include: {
        repository: {
          select: {
            repoUrl: true,
          },
        },
      },
    });

    if (!job) {
      return undefined;
    }

    return this.toRecord(job);
  }

  async updateStatus(
    input: UpdateAnalysisJobStatusInput
  ): Promise<AnalysisJobRecord | undefined> {
    const existing = await this.prisma.analysisJob.findUnique({
      where: { id: input.job_id },
      include: {
        repository: {
          select: {
            repoUrl: true,
          },
        },
      },
    });
    if (!existing) {
      return undefined;
    }

    const nextStatus = input.status;
    const updated = await this.prisma.analysisJob.update({
      where: { id: input.job_id },
      data: {
        status: nextStatus,
        progress: input.progress ?? this.defaultProgressFor(nextStatus),
        partial: input.partial ?? existing.partial,
        metricsSummary:
          input.metrics_summary !== undefined
            ? JSON.stringify(input.metrics_summary)
            : existing.metricsSummary,
        errorCode: input.error_code ?? existing.errorCode,
        errorMessage: input.error_message ?? existing.errorMessage,
        startedAt:
          existing.startedAt ??
          (nextStatus === "RUNNING_QUICK" ? new Date() : existing.startedAt),
        finishedAt:
          nextStatus === "SUCCEEDED" || nextStatus === "FAILED_FINAL"
            ? new Date()
            : existing.finishedAt,
      },
      include: {
        repository: {
          select: {
            repoUrl: true,
          },
        },
      },
    });

    return this.toRecord(updated);
  }

  async findLatestSucceeded(
    repoUrl: string,
    timeWindow: string
  ): Promise<AnalysisJobRecord | undefined> {
    const repo = await this.prisma.repository.findUnique({
      where: { repoUrl },
      select: { id: true },
    });
    if (!repo) return undefined;

    const job = await this.prisma.analysisJob.findFirst({
      where: {
        repoId: repo.id,
        timeWindow,
        status: "SUCCEEDED",
        metricsSummary: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        repository: {
          select: { repoUrl: true },
        },
      },
    });

    if (!job) return undefined;
    return this.toRecord(job);
  }

  private async ensureRepository(repoUrl: string): Promise<{ id: string }> {
    const found = await this.prisma.repository.findUnique({
      where: { repoUrl },
      select: { id: true },
    });
    if (found) {
      return found;
    }

    return this.prisma.repository.create({
      data: {
        repoUrl,
        isPrivate: repoUrl.includes("github.com"),
      },
      select: {
        id: true,
      },
    });
  }

  private toRecord(job: PrismaJobRecord): AnalysisJobRecord {
    let parsedSummary: Record<string, unknown> | null = null;
    if (typeof job.metricsSummary === "string") {
      try {
        parsedSummary = JSON.parse(job.metricsSummary) as Record<string, unknown>;
      } catch {
        parsedSummary = null;
      }
    }
    return {
      job_id: job.id,
      repo_url: job.repository.repoUrl,
      time_window: job.timeWindow,
      status: job.status as AnalysisJobStatus,
      progress: job.progress,
      partial: job.partial,
      metrics_summary: parsedSummary,
      error_code: job.errorCode,
      error_message: job.errorMessage,
      accepted_at: job.createdAt.toISOString(),
      started_at: job.startedAt?.toISOString() ?? null,
      finished_at: job.finishedAt?.toISOString() ?? null,
      updated_at: job.updatedAt.toISOString(),
    };
  }



  async list(input?: ListAnalysisJobsInput): Promise<AnalysisJobRecord[]> {
    const where: Record<string, unknown> = {};
    if (input?.status) where.status = input.status;
    const jobs = await this.prisma.analysisJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: input?.limit ?? 50,
      skip: input?.offset ?? 0,
      include: {
        repository: {
          select: { repoUrl: true },
        },
      },
    });
    return jobs.map((j: PrismaJobRecord) => this.toRecord(j));
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
