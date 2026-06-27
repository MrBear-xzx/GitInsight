import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { CreateAnalysisJobDto } from "./dto/create-analysis-job.dto";
import { AnalysisJobResponseDto } from "./dto/analysis-job-response.dto";
import { AnalysisJobStatus, AnalysisJobStore, ListAnalysisJobsInput } from "./analysis-job.store";
import { ANALYSIS_JOB_STORE_TOKEN } from "./analysis-job-store.provider";
import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";
import { ANALYSIS_JOB_DISPATCHER_TOKEN } from "./analysis-job-dispatcher.provider";

@Injectable()
export class AnalysisJobsService implements OnApplicationBootstrap {
  constructor(
    @Inject(ANALYSIS_JOB_STORE_TOKEN)
    private readonly store: AnalysisJobStore,
    @Inject(ANALYSIS_JOB_DISPATCHER_TOKEN)
    private readonly dispatcher: AnalysisJobDispatcher
  ) {}

  onApplicationBootstrap() {
    this.startScheduledAnalysis(process.env);
  }

  async create(dto: CreateAnalysisJobDto): Promise<AnalysisJobResponseDto> {
    const created = await this.store.create(dto);
    const dispatchMode = (process.env.ANALYSIS_JOB_DISPATCH_MODE ?? "inline").toLowerCase();
    const autoProcessEnabled = process.env.ANALYSIS_JOB_AUTOPROCESS === "true";

    if (!autoProcessEnabled && dispatchMode !== "queue") {
      return created;
    }

    await this.dispatcher.dispatch(created.job_id, {
      repo_url: dto.repo_url,
      time_window: dto.time_window,
      trigger_type: dto.trigger_type,
    });
    return (await this.store.get(created.job_id)) ?? created;
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

  private startScheduledAnalysis(env: NodeJS.ProcessEnv): void {
    const enabled = env.SCHEDULED_ANALYSIS_ENABLED === "true";
    if (!enabled) return;

    const intervalMs = Number(env.SCHEDULED_ANALYSIS_INTERVAL_MS) || 6 * 60 * 60 * 1000; // default 6h
    const reposRaw = env.SCHEDULED_ANALYSIS_REPOS;
    if (!reposRaw) {
      console.warn("[ScheduledAnalysis] SCHEDULED_ANALYSIS_ENABLED=true but SCHEDULED_ANALYSIS_REPOS is not set");
      return;
    }

    let repos: Array<{ repo_url: string; time_window?: string; pat?: string }>;
    try {
      repos = JSON.parse(reposRaw);
    } catch {
      console.warn("[ScheduledAnalysis] SCHEDULED_ANALYSIS_REPOS is not valid JSON");
      return;
    }

    if (repos.length === 0) return;

    console.log(`[ScheduledAnalysis] Starting scheduled analysis for ${repos.length} repos every ${intervalMs}ms`);

    const runScheduled = async () => {
      for (const repo of repos) {
        try {
          const dto: CreateAnalysisJobDto = {
            repo_url: repo.repo_url,
            time_window: repo.time_window ?? "90d",
            trigger_type: "scheduled",
          };
          const created = await this.store.create(dto);
          await this.dispatcher.dispatch(created.job_id, {
            repo_url: dto.repo_url,
            time_window: dto.time_window,
            trigger_type: dto.trigger_type,
          });
          console.log(`[ScheduledAnalysis] Dispatched job ${created.job_id} for ${repo.repo_url}`);
        } catch (err) {
          console.error(`[ScheduledAnalysis] Failed to dispatch for ${repo.repo_url}:`, err instanceof Error ? err.message : err);
        }
      }
    };

    // Run once immediately at startup
    runScheduled();

    // Then repeat at interval
    setInterval(runScheduled, intervalMs);
  }
}
