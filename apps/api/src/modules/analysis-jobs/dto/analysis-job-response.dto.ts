export class AnalysisJobResponseDto {
  job_id!: string;
  status!: string;
  progress!: number;
  partial!: boolean;
  error_code!: string | null;
  error_message!: string | null;
  accepted_at!: string;
  started_at!: string | null;
  finished_at!: string | null;
  updated_at!: string;
}
