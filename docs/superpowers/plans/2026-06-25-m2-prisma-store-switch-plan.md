# GitInsight M2 Prisma Store 切换计划（2026-06-25）

## 背景
- 现有任务状态已具备统一 store 抽象，但默认仅内存实现，无法在进程重启后保留任务状态。
- 需要在不影响现有接口的前提下，增加 Prisma 存储实现并可通过配置切换。

## 目标
1. 新增 `PrismaAnalysisJobStore`，支持 `create/get/updateStatus`。
2. 新增 provider 选择策略：默认内存，`ANALYSIS_JOB_STORE=prisma` 且有 `DATABASE_URL` 时启用 Prisma。
3. API 服务层兼容异步 store。
4. 增加 provider 策略测试与 Prisma store 行为测试。

## 实施
1. 定义 `PrismaLikeClient` 最小接口，避免直接依赖 `PrismaClient` 类型导出。
2. `analysis-job-store.provider` 中运行时加载 `@prisma/client`。
3. `AnalysisJobsService` 调整为 async，控制器同步调整。

## 测试
1. 红灯：
   - `analysis-job-store.provider.spec.ts`（目标文件不存在时失败）
   - `prisma-analysis-job.store.spec.ts`（目标文件不存在时失败）
2. 绿灯：
   - `pnpm --filter @gitinsight/api test:unit -- analysis-job-store.provider.spec.ts`
   - `pnpm --filter @gitinsight/api test:unit -- prisma-analysis-job.store.spec.ts`
3. 回归：
   - `pnpm --filter @gitinsight/api test:unit`
   - `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`

## 风险
- 当前尚未接入 Prisma migration/runtime 初始化流程，实际连接数据库仍依赖环境配置正确。
