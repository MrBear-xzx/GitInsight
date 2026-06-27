import { Controller, Get, Inject, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller()
export class DashboardController {
  constructor(
    @Inject(DashboardService)
    private readonly dashboardService: DashboardService
  ) {}

  @Get("/api/v1/dashboard")
  get(@Query("repo_id") repoId: string, @Query("window") window: string) {
    return this.dashboardService.getDashboard(repoId, window);
  }
}

