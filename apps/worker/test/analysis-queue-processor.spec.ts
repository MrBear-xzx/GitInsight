import { processAnalysisJob } from "../src/processors/analysis-queue.processor";

describe("analysis queue processor", () => {
  it("moves job to succeeded when processing succeeds (legacy, no payload)", async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const store = { updateStatus } as never;

    await processAnalysisJob({
      store,
      jobId: "job_1",
      shouldFail: false,
    });

    expect(updateStatus).toHaveBeenNthCalledWith(1, {
      job_id: "job_1",
      status: "RUNNING_QUICK",
    });
    expect(updateStatus).toHaveBeenNthCalledWith(2, {
      job_id: "job_1",
      status: "QUICK_DONE",
    });
    expect(updateStatus).toHaveBeenNthCalledWith(3, {
      job_id: "job_1",
      status: "RUNNING_DEEP",
    });
    expect(updateStatus).toHaveBeenNthCalledWith(4, {
      job_id: "job_1",
      status: "SUCCEEDED",
    });
  });

  it("marks FAILED_FINAL when processing throws on last attempt", async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const store = { updateStatus } as never;

    // Last attempt re-throws the error
    await expect(
      processAnalysisJob({
        store,
        jobId: "job_2",
        shouldFail: true,
        attempt: 1,
        maxAttempts: 1,
      })
    ).rejects.toThrow("simulated queue failure");

    expect(updateStatus).toHaveBeenCalledWith({
      job_id: "job_2",
      status: "FAILED_FINAL",
      error_code: "INTERNAL_ERROR",
      error_message: "simulated queue failure",
    });
  });

  it("marks FAILED_RETRYABLE on non-last attempt, FAILED_FINAL on last", async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const store = { updateStatus } as never;

    // Non-last attempt: does NOT re-throw
    await processAnalysisJob({
      store,
      jobId: "job_3",
      shouldFail: true,
      attempt: 1,
      maxAttempts: 3,
    });

    expect(updateStatus).toHaveBeenCalledWith({
      job_id: "job_3",
      status: "FAILED_RETRYABLE",
      error_code: "INTERNAL_ERROR",
      error_message: "simulated queue failure",
    });

    updateStatus.mockClear();

    // Last attempt: re-throws
    await expect(
      processAnalysisJob({
        store,
        jobId: "job_3",
        shouldFail: true,
        attempt: 3,
        maxAttempts: 3,
      })
    ).rejects.toThrow("simulated queue failure");

    expect(updateStatus).toHaveBeenCalledWith({
      job_id: "job_3",
      status: "FAILED_FINAL",
      error_code: "INTERNAL_ERROR",
      error_message: "simulated queue failure",
    });
  });
});
