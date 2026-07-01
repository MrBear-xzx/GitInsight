import { Injectable, Inject } from "@nestjs/common";
import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";
import { AnalysisJobStore, ANALYSIS_JOB_STORE_TOKEN } from "./analysis-job.store";
import { processAnalysisJob } from "../../../../worker/src/processors/analysis-queue.processor";

@Injectable()
export class AnalysisJobInlineDispatcher implements AnalysisJobDispatcher {
  constructor(
    @Inject(ANALYSIS_JOB_STORE_TOKEN)
    private readonly store: AnalysisJobStore
  ) {}

  async dispatch(
    jobId: string,
    payload: { repo_url: string; time_window: string; trigger_type: string }
  ): Promise<void> {
    await processAnalysisJob({
      store: this.store,
      jobId,
      payload,
      shouldFail: false,
      attempt: 1,
      maxAttempts: 1,
    });
  }
}
