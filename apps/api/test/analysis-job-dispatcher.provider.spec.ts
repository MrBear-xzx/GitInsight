import { buildAnalysisJobDispatcher } from "../src/modules/analysis-jobs/analysis-job-dispatcher.provider";
import { AnalysisJobInlineDispatcher } from "../src/modules/analysis-jobs/analysis-job-inline.dispatcher";
import { AnalysisJobQueueDispatcher } from "../src/modules/analysis-jobs/analysis-job-queue.dispatcher";

describe("analysis job dispatcher provider", () => {
  it("uses inline dispatcher by default", () => {
    const dispatcher = buildAnalysisJobDispatcher({
      env: {},
      inlineDispatcherFactory: () => new AnalysisJobInlineDispatcher({} as never),
      queueDispatcherFactory: () => new AnalysisJobQueueDispatcher({} as never),
    });

    expect(dispatcher).toBeInstanceOf(AnalysisJobInlineDispatcher);
  });

  it("uses queue dispatcher when ANALYSIS_JOB_DISPATCH_MODE=queue", () => {
    const dispatcher = buildAnalysisJobDispatcher({
      env: {
        ANALYSIS_JOB_DISPATCH_MODE: "queue",
      },
      inlineDispatcherFactory: () => new AnalysisJobInlineDispatcher({} as never),
      queueDispatcherFactory: () => new AnalysisJobQueueDispatcher({} as never),
    });

    expect(dispatcher).toBeInstanceOf(AnalysisJobQueueDispatcher);
  });
});
