import { Inject, Injectable } from "@nestjs/common";
import { AnalysisJobStatus } from "./analysis-job.store";
import { AnalysisJobStore } from "./analysis-job.store";
import { ANALYSIS_JOB_STORE_TOKEN } from "./analysis-job-store.provider";

const COMPLETION_FLOW: AnalysisJobStatus[] = [
  "RUNNING_QUICK",
  "QUICK_DONE",
  "RUNNING_DEEP",
  "SUCCEEDED",
];

@Injectable()
export class AnalysisJobOrchestrator {
  constructor(
    @Inject(ANALYSIS_JOB_STORE_TOKEN)
    private readonly store: AnalysisJobStore
  ) {}

  async runToCompletion(jobId: string): Promise<void> {
    for (const status of COMPLETION_FLOW) {
      await this.store.updateStatus({ job_id: jobId, status });
    }
  }
}
