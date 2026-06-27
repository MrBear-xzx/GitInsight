# M2: Dashboard 从真实快照读取指标

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

Dashboard 接口不再返回 hardcode 模拟数据，改为从 `AnalysisJobStore` 读取最近成功 job 的 `metrics_summary`。

## 改动清单

### 类型层
- `analysis-job.store.ts`：`AnalysisJobRecord` 新增 `time_window`、`metrics_summary` 字段；`UpdateAnalysisJobStatusInput` 新增 `metrics_summary`；接口新增 `findLatestSucceeded(repoUrl, timeWindow)` 方法
- `analysis-job-status.ts`（新）：从 store 拆分出 `AnalysisJobStatus` 类型，避免循环依赖
- `prisma-job-store.types.ts`：`PrismaJobRecord` 新增 `timeWindow`、`metricsSummary`；`PrismaLikeClient` 新增 `findFirst`

### 存储层
- `in-memory-analysis-job.store.ts`：`create` 保存 `time_window`；`updateStatus` 透传 `metrics_summary`；实现 `findLatestSucceeded`
- `prisma-analysis-job.store.ts`：`updateStatus` 写入 `metricsSummary`（JSON 序列化）；`toRecord` 解析 `metricsSummary`；实现 `findLatestSucceeded`

### Schema
- `prisma/schema.prisma`：`AnalysisJob` 模型新增 `metricsSummary String?`

### 服务层
- `dashboard.service.ts`：注入 `AnalysisJobStore`；优先从 `findLatestSucceeded` 读取指标；无数据时降级返回 fallback 模拟数据

### 测试
- `dashboard.e2e-spec.ts`：覆盖无数据 fallback + 有真实 metrics 两个场景
- `prisma-analysis-job.store.spec.ts`：mock 补充 `timeWindow`、`metricsSummary`、`findFirst`
- `analysis-job-store.provider.spec.ts`：mock 补充 `findFirst`

## 验证

- `pnpm --filter @gitinsight/api test:unit` — 10 suites, 17 tests PASS
- `pnpm --filter @gitinsight/api test:e2e` — 4 suites, 8 tests PASS
- `pnpm --filter @gitinsight/worker test:unit` — 6 suites, 10 tests PASS
