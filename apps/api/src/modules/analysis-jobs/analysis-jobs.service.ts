import { Inject, Injectable } from "@nestjs/common";
import { AnalysisJobResponseDto } from "./dto/analysis-job-response.dto";
import { AnalysisJobStatus, AnalysisJobStore, ListAnalysisJobsInput, ANALYSIS_JOB_STORE_TOKEN, ANALYSIS_JOB_DISPATCHER_TOKEN } from "./analysis-job.store";
import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";
import { CreateAnalysisJobDto } from "./dto/create-analysis-job.dto";

@Injectable()
export class AnalysisJobsService {
  constructor(
    @Inject(ANALYSIS_JOB_STORE_TOKEN)
    private readonly store: AnalysisJobStore,
    @Inject(ANALYSIS_JOB_DISPATCHER_TOKEN)
    private readonly dispatcher: AnalysisJobDispatcher
  ) {}

  async create(dto: CreateAnalysisJobDto): Promise<AnalysisJobResponseDto> {
    const created = await this.store.create(dto);

    // Auto-dispatch analysis unless explicitly disabled (e.g. in CI tests)
    if (process.env.ANALYSIS_JOB_AUTOPROCESS !== "false") {
      this.dispatcher.dispatch(created.job_id, {
        repo_url: dto.repo_url,
        time_window: dto.time_window,
        trigger_type: dto.trigger_type,
      }).catch((err) => {
        console.error(`[AnalysisJob] Dispatch failed for ${created.job_id}:`, err instanceof Error ? err.message : err);
      });
    }

    return created;
  }

  async get(jobId: string): Promise<AnalysisJobResponseDto | undefined> {
    return this.store.get(jobId);
  }

  async list(input?: ListAnalysisJobsInput): Promise<AnalysisJobResponseDto[]> {
    return this.store.list(input);
  }

  async updateStatus(
    jobId: string,
    status: AnalysisJobStatus
  ): Promise<AnalysisJobResponseDto | undefined> {
    return this.store.updateStatus({ job_id: jobId, status });
  }
}
