import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { AnalysisJobsController } from "./modules/analysis-jobs/analysis-jobs.controller";
import { AnalysisJobsService } from "./modules/analysis-jobs/analysis-jobs.service";
import { AnalysisJobInlineDispatcher } from "./modules/analysis-jobs/analysis-job-inline.dispatcher";
import { InMemoryAnalysisJobStore } from "./modules/analysis-jobs/in-memory-analysis-job.store";
import { ANALYSIS_JOB_STORE_TOKEN, ANALYSIS_JOB_DISPATCHER_TOKEN } from "./modules/analysis-jobs/analysis-job.store";
import { DashboardController } from "./modules/dashboard/dashboard.controller";
import { DashboardService } from "./modules/dashboard/dashboard.service";

@Module({
  controllers: [HealthController, AnalysisJobsController, DashboardController],
  providers: [
    AnalysisJobsService,
    { provide: ANALYSIS_JOB_DISPATCHER_TOKEN, useClass: AnalysisJobInlineDispatcher },
    { provide: ANALYSIS_JOB_STORE_TOKEN, useClass: InMemoryAnalysisJobStore },
    DashboardService,
  ],
})
export class AppModule {}
