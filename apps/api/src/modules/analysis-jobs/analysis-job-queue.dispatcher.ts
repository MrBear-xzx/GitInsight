import { Injectable } from "@nestjs/common";
import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";

type AnalysisQueuePort = {
  add(
    name: string,
    data: {
      jobId: string;
      payload: { repo_url: string; time_window: string; trigger_type: string };
    },
    options: {
      attempts: number;
      removeOnComplete: boolean;
      removeOnFail: boolean;
    }
  ): Promise<unknown>;
};

@Injectable()
export class AnalysisJobQueueDispatcher implements AnalysisJobDispatcher {
  constructor(private readonly queue: AnalysisQueuePort) {}

  async dispatch(
    jobId: string,
    payload: { repo_url: string; time_window: string; trigger_type: string }
  ): Promise<void> {
    await this.queue.add(
      "analysis-job",
      { jobId, payload },
      {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }
}
