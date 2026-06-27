import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import {
  ANALYSIS_JOB_DISPATCHER_TOKEN,
  buildAnalysisJobDispatcher,
} from "./modules/analysis-jobs/analysis-job-dispatcher.provider";
import { AnalysisJobInlineDispatcher } from "./modules/analysis-jobs/analysis-job-inline.dispatcher";
import { AnalysisJobQueueDispatcher } from "./modules/analysis-jobs/analysis-job-queue.dispatcher";
import { AnalysisJobsController } from "./modules/analysis-jobs/analysis-jobs.controller";
import { AnalysisJobOrchestrator } from "./modules/analysis-jobs/analysis-job.orchestrator";
import { AnalysisJobsService } from "./modules/analysis-jobs/analysis-jobs.service";
import {
  ANALYSIS_JOB_STORE_TOKEN,
  buildAnalysisJobStore,
} from "./modules/analysis-jobs/analysis-job-store.provider";
import { processAnalysisJob } from "../../worker/src/processors/analysis-queue.processor";
import { DashboardController } from "./modules/dashboard/dashboard.controller";
import { DashboardService } from "./modules/dashboard/dashboard.service";

@Module({
  controllers: [HealthController, AnalysisJobsController, DashboardController],
  providers: [
    AnalysisJobsService,
    AnalysisJobOrchestrator,
    AnalysisJobInlineDispatcher,
    {
      provide: AnalysisJobQueueDispatcher,
      inject: [ANALYSIS_JOB_STORE_TOKEN],
      useFactory: (store: {
        updateStatus(input: {
          job_id: string;
          status: string;
          error_code?: string | null;
          error_message?: string | null;
        }): Promise<unknown>;
      }) => {
        const queuePort = {
          add: async (
            _name: string,
            _data: { jobId: string; payload?: { repo_url: string; time_window: string; trigger_type: string } },
            _options: { attempts?: number }
          ) => {
            if ((process.env.ANALYSIS_JOB_DISPATCH_MODE ?? "inline") !== "queue") {
              return undefined;
            }
            const executionMode = (
              process.env.ANALYSIS_JOB_QUEUE_EXECUTION_MODE ??
              (process.env.NODE_ENV === "test" ? "inprocess" : "bullmq")
            ).toLowerCase();

            if (executionMode === "inprocess") {
              await processAnalysisJob({
                store,
                jobId: _data.jobId,
                payload: _data.payload,
                shouldFail: false,
                attempt: 1,
                maxAttempts: _options.attempts ?? 1,
              });
              return undefined;
            }
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { Queue } = require("bullmq");
            const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
            const queue = new Queue("analysis-jobs", {
              connection: {
                url: redisUrl,
              },
            });
            return queue.add(_name, _data, _options);
          },
        };
        return new AnalysisJobQueueDispatcher(queuePort);
      },
    },
    {
      provide: ANALYSIS_JOB_DISPATCHER_TOKEN,
      inject: [AnalysisJobInlineDispatcher, AnalysisJobQueueDispatcher],
      useFactory: (
        inlineDispatcher: AnalysisJobInlineDispatcher,
        queueDispatcher: AnalysisJobQueueDispatcher
      ) =>
        buildAnalysisJobDispatcher({
          env: process.env,
          inlineDispatcherFactory: () => inlineDispatcher,
          queueDispatcherFactory: () => queueDispatcher,
        }),
    },
    {
      provide: ANALYSIS_JOB_STORE_TOKEN,
      useFactory: () =>
        buildAnalysisJobStore({
          env: process.env,
        }),
    },
    DashboardService,
  ],
})
export class AppModule {}
