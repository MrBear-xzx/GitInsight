export type AnalysisJobStatus =
  | "PENDING"
  | "RUNNING_QUICK"
  | "QUICK_DONE"
  | "RUNNING_DEEP"
  | "SUCCEEDED"
  | "FAILED_RETRYABLE"
  | "FAILED_FINAL";
