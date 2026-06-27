import { AnalysisJobDispatcher } from "./analysis-job.dispatcher";
import { AnalysisJobInlineDispatcher } from "./analysis-job-inline.dispatcher";
import { AnalysisJobQueueDispatcher } from "./analysis-job-queue.dispatcher";

export const ANALYSIS_JOB_DISPATCHER_TOKEN = "ANALYSIS_JOB_DISPATCHER";

type BuildAnalysisJobDispatcherOptions = {
  env: NodeJS.ProcessEnv;
  inlineDispatcherFactory: () => AnalysisJobInlineDispatcher;
  queueDispatcherFactory: () => AnalysisJobQueueDispatcher;
};

export function buildAnalysisJobDispatcher(
  options: BuildAnalysisJobDispatcherOptions
): AnalysisJobDispatcher {
  const mode = (options.env.ANALYSIS_JOB_DISPATCH_MODE ?? "inline").toLowerCase();
  if (mode === "queue") {
    return options.queueDispatcherFactory();
  }

  return options.inlineDispatcherFactory();
}
