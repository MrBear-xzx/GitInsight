import { Job, Worker } from "bullmq";
import { ANALYSIS_QUEUE } from "./queues/analysis.queue";
import { processAnalysisJob } from "./processors/analysis-queue.processor";
import { buildAnalysisJobStore } from "../../api/src/modules/analysis-jobs/analysis-job-store.provider";

type WorkerEnv = {
  REDIS_URL?: string;
  WORKER_CONCURRENCY?: string;
};

export function createWorkerOptions(env: WorkerEnv) {
  const redisUrl = env.REDIS_URL ?? "redis://127.0.0.1:6379";
  const concurrency = Number(env.WORKER_CONCURRENCY ?? "2");

  return {
    connection: {
      url: redisUrl,
    },
    concurrency,
  };
}

type AnalysisJobStorePort = {
  updateStatus(input: {
    job_id: string;
    status: string;
    error_code?: string | null;
    error_message?: string | null;
  }): Promise<unknown>;
};

export function createJobRunner(store: AnalysisJobStorePort) {
  return async (job: Job<{ jobId: string; shouldFail?: boolean }>) => {
    await processAnalysisJob({
      store,
      jobId: job.data.jobId,
      shouldFail: Boolean(job.data.shouldFail),
      attempt: job.attemptsMade + 1,
      maxAttempts: (job.opts.attempts as number | undefined) ?? 1,
    });
  };
}

export function startWorker(env: WorkerEnv = process.env): Worker {
  const workerOptions = createWorkerOptions(env);
  const store = buildAnalysisJobStore({ env: process.env });
  const runJob = createJobRunner(store);

  return new Worker(
    ANALYSIS_QUEUE,
    runJob,
    workerOptions
  );
}

if (process.env.NODE_ENV !== "test") {
  startWorker();
}
