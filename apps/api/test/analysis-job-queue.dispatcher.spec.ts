import { AnalysisJobQueueDispatcher } from "../src/modules/analysis-jobs/analysis-job-queue.dispatcher";

describe("AnalysisJobQueueDispatcher", () => {
  it("enqueues analysis job with retry options and payload", async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const queue = { add };
    const dispatcher = new AnalysisJobQueueDispatcher(queue as never);

    await dispatcher.dispatch("job_1", {
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
    });

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith(
      "analysis-job",
      {
        jobId: "job_1",
        payload: {
          repo_url: "https://github.com/org/repo",
          time_window: "90d",
          trigger_type: "manual",
        },
      },
      expect.objectContaining({
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      })
    );
  });
});
