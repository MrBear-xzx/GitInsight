import { PrismaAnalysisJobStore } from "../src/modules/analysis-jobs/prisma-analysis-job.store";

describe("PrismaAnalysisJobStore", () => {
  const now = new Date("2026-06-25T12:00:00.000Z");
  const now2 = new Date("2026-06-25T12:01:00.000Z");

  const baseJob = {
    timeWindow: "90d",
    metricsSummary: null,
  };

  it("creates and maps a pending job", async () => {
    const repositoryFindUnique = jest.fn().mockResolvedValue(null);
    const repositoryCreate = jest.fn().mockResolvedValue({
      id: "repo_1",
      repoUrl: "https://github.com/org/repo",
    });
    const analysisJobCreate = jest.fn().mockResolvedValue({
      id: "job_1",
      status: "PENDING",
      progress: 0,
      partial: false,
      errorCode: null,
      errorMessage: null,
      ...baseJob,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      updatedAt: now,
      repository: { repoUrl: "https://github.com/org/repo" },
    });
    const prisma = {
      repository: {
        findUnique: repositoryFindUnique,
        create: repositoryCreate,
      },
      analysisJob: {
        create: analysisJobCreate,
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    const store = new PrismaAnalysisJobStore(prisma as never);

    const result = await store.create({
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
    });

    expect(result.job_id).toBe("job_1");
    expect(result.status).toBe("PENDING");
    expect(result.progress).toBe(0);
    expect(result.repo_url).toBe("https://github.com/org/repo");
    expect(repositoryFindUnique).toHaveBeenCalled();
    expect(repositoryCreate).toHaveBeenCalled();
    expect(analysisJobCreate).toHaveBeenCalled();
  });

  it("updates status and maps timestamps", async () => {
    const analysisJobFindUnique = jest.fn().mockResolvedValue({
      id: "job_1",
      status: "PENDING",
      progress: 0,
      partial: false,
      errorCode: null,
      errorMessage: null,
      ...baseJob,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      updatedAt: now,
      repository: { repoUrl: "https://github.com/org/repo" },
    });
    const analysisJobUpdate = jest.fn().mockResolvedValue({
      id: "job_1",
      status: "RUNNING_QUICK",
      progress: 25,
      partial: false,
      errorCode: null,
      errorMessage: null,
      ...baseJob,
      createdAt: now,
      startedAt: now2,
      finishedAt: null,
      updatedAt: now2,
      repository: { repoUrl: "https://github.com/org/repo" },
    });
    const prisma = {
      analysisJob: {
        findUnique: analysisJobFindUnique,
        update: analysisJobUpdate,
        findFirst: jest.fn(),
      findMany: jest.fn(),
      },
    };
    const store = new PrismaAnalysisJobStore(prisma as never);

    const result = await store.updateStatus({
      job_id: "job_1",
      status: "RUNNING_QUICK",
    });

    expect(result).toBeDefined();
    expect(result?.status).toBe("RUNNING_QUICK");
    expect(result?.started_at).toBe(now2.toISOString());
    expect(result?.updated_at).toBe(now2.toISOString());
    expect(analysisJobFindUnique).toHaveBeenCalled();
  });
});
