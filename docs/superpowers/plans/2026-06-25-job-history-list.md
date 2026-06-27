# 任务历史列表页面

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

添加 `GET /api/v1/analysis-jobs` 列表接口和前端历史记录页面。

## 改动清单

### API
- `analysis-job.store.ts` — 新增 `ListAnalysisJobsInput` 类型、`list()` 接口
- `in-memory-analysis-job.store.ts` — 实现 `list()`（按时间倒序、支持 limit/offset/status 过滤）
- `prisma-analysis-job.store.ts` — 实现 `list()`（Prisma findMany）
- `prisma-job-store.types.ts` — `PrismaLikeClient` 新增 `findMany`
- `analysis-jobs.controller.ts` — 新增 `GET /api/v1/analysis-jobs` 路由
- `analysis-jobs.service.ts` — 新增 `list()` 透传

### 前端
- `lib/api.ts` — 新增 `listAnalysisJobs()` + `AnalysisJob` 补充 `repo_url`/`time_window`
- `app/history/page.tsx`（新）— 历史记录表格页面
- `app/layout.tsx` — 导航栏增加「记录」入口

### 测试
- `analysis-jobs.e2e-spec.ts` — 4 个用例覆盖创建/列表/详情/404

## 验证

- pnpm --filter @gitinsight/api test:unit — 10 suites, 17 passed
- pnpm --filter @gitinsight/api test:e2e — 4 suites, 8 passed
- pnpm --filter @gitinsight/web build — 4 routes 编译成功
