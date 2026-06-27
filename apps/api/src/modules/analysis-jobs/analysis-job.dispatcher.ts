export interface AnalysisJobDispatcher {
  dispatch(
    jobId: string,
    payload: {
      repo_url: string;
      time_window: string;
      trigger_type: string;
    }
  ): Promise<void>;
}
