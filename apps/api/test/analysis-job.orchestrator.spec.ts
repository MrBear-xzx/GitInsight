import { AnalysisJobOrchestrator } from "../src/modules/analysis-jobs/analysis-job.orchestrator";

describe("AnalysisJobOrchestrator", () => {
  it("updates status in expected order", async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const orchestrator = new AnalysisJobOrchestrator({
      updateStatus,
    } as never);

    await orchestrator.runToCompletion("job_1");

    expect(updateStatus).toHaveBeenCalledTimes(4);
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
});
