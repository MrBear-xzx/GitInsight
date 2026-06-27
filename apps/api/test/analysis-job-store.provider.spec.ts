import { buildAnalysisJobStore } from "../src/modules/analysis-jobs/analysis-job-store.provider";
import { InMemoryAnalysisJobStore } from "../src/modules/analysis-jobs/in-memory-analysis-job.store";
import { PrismaAnalysisJobStore } from "../src/modules/analysis-jobs/prisma-analysis-job.store";

describe("analysis job store provider", () => {
  const makePrismaMock = () => ({
    repository: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    analysisJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  });

  it("uses in-memory store by default", () => {
    const prismaFactory = jest.fn();

    const store = buildAnalysisJobStore({
      env: {},
      prismaClientFactory: prismaFactory,
    });

    expect(store).toBeInstanceOf(InMemoryAnalysisJobStore);
    expect(prismaFactory).not.toHaveBeenCalled();
  });

  it("uses prisma store when enabled with DATABASE_URL", () => {
    const prismaMock = makePrismaMock();
    const prismaFactory = jest.fn(() => prismaMock);

    const store = buildAnalysisJobStore({
      env: {
        ANALYSIS_JOB_STORE: "prisma",
        DATABASE_URL: "postgresql://local/test",
      },
      prismaClientFactory: prismaFactory,
    });

    expect(store).toBeInstanceOf(PrismaAnalysisJobStore);
    expect(prismaFactory).toHaveBeenCalledTimes(1);
  });
});
