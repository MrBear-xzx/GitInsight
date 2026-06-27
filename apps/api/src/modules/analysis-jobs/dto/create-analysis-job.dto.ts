import { ApiProperty } from "@nestjs/swagger";

export class CreateAnalysisJobDto {
  @ApiProperty({ description: "Git 仓库完整 URL，如 https://github.com/org/repo" })
  repo_url!: string;

  @ApiProperty({ description: "时间窗口，可选 30d/90d/180d", example: "90d" })
  time_window!: string;

  @ApiProperty({ description: "触发方式：manual 表示手动触发", example: "manual" })
  trigger_type!: string;
}
