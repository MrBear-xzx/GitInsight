import { Injectable } from "@nestjs/common";
import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";
import { AnalysisJobOrchestrator } from "./analysis-job.orchestrator";

@Injectable()
export class AnalysisJobInlineDispatcher implements AnalysisJobDispatcher {
  constructor(private readonly orchestrator: AnalysisJobOrchestrator) {}

  async dispatch(
    jobId: string,
    _payload: { repo_url: string; time_window: string; trigger_type: string }
  ): Promise<void> {
    await this.orchestrator.runToCompletion(jobId);
  }
}
