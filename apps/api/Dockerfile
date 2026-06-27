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

EXPOSE 3000

# Healthcheck - use node built-in http, no need to install curl/wget
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["pnpm", "--filter", "@gitinsight/api", "start"]