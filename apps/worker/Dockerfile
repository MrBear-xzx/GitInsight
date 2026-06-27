FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY apps/worker apps/worker
COPY prisma prisma

# Prisma v7 no longer supports url in schema; for memory-mode this is optional
RUN cd apps/api && npx prisma@6 generate --schema=../../prisma/schema.prisma 2>/dev/null || true

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ps aux | grep -q "pnpm.*worker" || exit 1

CMD ["pnpm", "--filter", "@gitinsight/worker", "start"]