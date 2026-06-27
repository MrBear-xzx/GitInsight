import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { AnalysisJobsService } from "./analysis-jobs.service";
import { CreateAnalysisJobDto } from "./dto/create-analysis-job.dto";
import { AnalysisJobStatus } from "./analysis-job.store";

@Controller()
export class AnalysisJobsController {
  constructor(
    @Inject(AnalysisJobsService)
    private readonly analysisJobsService: AnalysisJobsService
  ) {}

  @Post("/api/v1/analysis-jobs")
  @HttpCode(202)
  async create(@Body() dto: CreateAnalysisJobDto) {
    return this.analysisJobsService.create(dto);
  }

  @Get("/api/v1/analysis-jobs")
  async list(
    @Query("limit") limit: string,
    @Query("offset") offset: string,
    @Query("status") status: string
  ) {
    return this.analysisJobsService.list({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      status: (status as AnalysisJobStatus) || undefined,
    });
  }

  @Get("/api/v1/analysis-jobs/:jobId")
  async get(@Param("jobId") jobId: string) {
    const job = await this.analysisJobsService.get(jobId);
    if (!job) {
      throw new NotFoundException("job not found");
    }
    return job;
  }
}
