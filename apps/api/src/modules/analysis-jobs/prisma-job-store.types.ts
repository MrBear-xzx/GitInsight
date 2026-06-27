export type PrismaJobRecord = {
  id: string;
  status: string;
  progress: number;
  partial: boolean;
  timeWindow: string;
  metricsSummary: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  updatedAt: Date;
  repository: {
    repoUrl: string;
  };
};

export type PrismaLikeClient = {
  repository: {
    findUnique: (input: unknown) => Promise<{ id: string } | null>;
    create: (input: unknown) => Promise<{ id: string }>;
  };
  analysisJob: {
    create: (input: unknown) => Promise<PrismaJobRecord>;
    findUnique: (input: unknown) => Promise<PrismaJobRecord | null>;
    findFirst: (input: unknown) => Promise<PrismaJobRecord | null>;
    findMany: (input: unknown) => Promise<PrismaJobRecord[]>;
    update: (input: unknown) => Promise<PrismaJobRecord>;
  };
};
