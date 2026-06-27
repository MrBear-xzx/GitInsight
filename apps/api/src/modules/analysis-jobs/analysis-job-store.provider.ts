import { AnalysisJobStore } from "./analysis-job.store";
import { InMemoryAnalysisJobStore } from "./in-memory-analysis-job.store";
import { PrismaAnalysisJobStore } from "./prisma-analysis-job.store";
import { PrismaLikeClient } from "./prisma-job-store.types";

export const ANALYSIS_JOB_STORE_TOKEN = "ANALYSIS_JOB_STORE";

type BuildAnalysisJobStoreOptions = {
  env: NodeJS.ProcessEnv;
  prismaClientFactory?: () => PrismaLikeClient;
};

export function buildAnalysisJobStore(
  options: BuildAnalysisJobStoreOptions
): AnalysisJobStore {
  const { env } = options;
  const storeType = (env.ANALYSIS_JOB_STORE ?? "memory").toLowerCase();
  const canUsePrisma = storeType === "prisma" && Boolean(env.DATABASE_URL);

  if (!canUsePrisma) {
    return new InMemoryAnalysisJobStore();
  }

  const prismaFactory =
    options.prismaClientFactory ??
    (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient } = require("@prisma/client");
      return new PrismaClient() as PrismaLikeClient;
    });
  return new PrismaAnalysisJobStore(prismaFactory());
}
