# GitInsight M2 队列-存储全链路联动计划（2026-06-25）

## 背景
- 已具备 queue 分发骨架与 worker 处理器重试口径，但 worker 入口仍未注入真实 store。
- 需要打通“job 消费 -> store 状态写回 -> API 查询可见”的最小闭环。

## 目标
1. Worker 入口注入 `AnalysisJobStore`，消费时真实调用 `updateStatus`。
2. API queue 路径在测试中可稳定触发并观测结果。
3. 保持现有接口兼容，补齐回归测试。

## 实施
1. `apps/worker/src/main.ts`
   - 新增 `createJobRunner(store)`，将 job 数据映射到 `processAnalysisJob`。
   - `startWorker` 使用 `buildAnalysisJobStore({ env })` 获取 store 并注入 runner。
2. `apps/api/src/app.module.ts`
   - queue dispatcher 增加 `inprocess` 执行模式（测试默认），调用 worker processor 执行并写回同一 store。
3. `apps/api/test/analysis-jobs.e2e-spec.ts`
   - 新增 queue 场景：独立 app 实例在 queue env 下初始化并验证状态推进结果。

## 测试
1. 红灯：
   - `worker-main.spec.ts`（createJobRunner 不存在）
   - `analysis-jobs.e2e-spec.ts` queue 场景失败
2. 绿灯：
   - `pnpm --filter @gitinsight/worker test:unit -- worker-main.spec.ts`
   - `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`
3. 全量可行回归：
   - `pnpm test`
   - `pnpm --filter @gitinsight/worker test:unit`
   - `pnpm --filter @gitinsight/api test:unit`
   - `pnpm --filter @gitinsight/api test:e2e`
