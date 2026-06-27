# Docker 端到端验证增强

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

修复 Dockerfile，添加前端容器化，补充健康检查，使 docker-compose 能一键启动完整应用。

## 改动清单

### 新增
- `.dockerignore` — 排除 node_modules / .git 等
- `apps/web/Dockerfile` — 前端容器化（Next.js build + runner 两阶段构建）

### 修改
- `apps/api/Dockerfile` — 使用 tsx 运行 TypeScript，安装 monorepo 所有依赖
- `apps/worker/Dockerfile` — 同上
- `apps/api/package.json` — 新增 dev/start scripts（tsx）
- `apps/worker/package.json` — 新增 dev/start scripts（tsx）
- `docker-compose.yml` — 新增 web 服务 + postgres/redis healthcheck

### docker-compose 服务一览

| 服务 | 端口 | 依赖 |
|------|------|------|
| postgres | 5432 | — |
| redis | 6379 | — |
| api | 3000 | postgres + redis |
| worker | — | postgres + redis |
| web | 3001 | api |

### 依赖变更
- `@gitinsight/api` 新增 devDependency: `tsx`
- `@gitinsight/worker` 新增 devDependency: `tsx`

## 验证

- pnpm --filter @gitinsight/worker test:unit — 32 passed
- pnpm --filter @gitinsight/api test:unit — 17 passed
- pnpm --filter @gitinsight/api test:e2e — 8 passed
