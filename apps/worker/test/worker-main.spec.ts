import { createWorkerOptions } from "../src/main";
import { createJobRunner } from "../src/main";

describe("worker main", () => {
  it("builds worker options with redis url and default concurrency", () => {
    const options = createWorkerOptions({
      REDIS_URL: "redis://127.0.0.1:6379",
    });

    expect(options.connection).toEqual({
      url: "redis://127.0.0.1:6379",
    });
    expect(options.concurrency).toBe(2);
  });

  it("job runner writes status via injected store", async () => {
    const updateStatus = jest.fn().mockResolvedValue(undefined);
    const runJob = createJobRunner({
      updateStatus,
    } as never);

    await runJob({
      data: { jobId: "job_1" },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as never);

    expect(updateStatus).toHaveBeenCalledWith({
      job_id: "job_1",
      status: "RUNNING_QUICK",
    });
    expect(updateStatus).toHaveBeenCalledWith({
      job_id: "job_1",
      status: "SUCCEEDED",
    });
  });
});
