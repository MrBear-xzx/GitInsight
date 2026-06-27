# GitInsight M2 BullMQ Worker 与重试策略计划（2026-06-25）

## 背景
- 目前 `queue` 分发模式仍是过渡态（不是真实 BullMQ 消费链路）。
- 需要补齐真实入队能力与 Worker 重试失败分支口径，为后续连接真实 store 打基础。

## 目标
1. API queue dispatcher 改为真实 `Queue.add`（含重试参数）。
2. Worker `main.ts` 提供可测的配置工厂并启动真实 `Worker`。
3. `processAnalysisJob` 增加重试语义：非最后一次失败写 `FAILED_RETRYABLE`，最后一次写 `FAILED_FINAL`。

## 实施
1. API：
   - `analysis-job-queue.dispatcher.ts` 使用 queue 端口调用 `add("analysis-job", { jobId }, options)`。
   - `app.module.ts` 在 queue 模式下延迟加载 BullMQ 并创建 queue。
2. Worker：
   - `main.ts` 新增 `createWorkerOptions` 与 `startWorker`。
   - `analysis-queue.processor.ts` 增加 `attempt/maxAttempts` 入参并映射失败状态。

## 测试
1. 红灯：
   - `analysis-job-queue.dispatcher.spec.ts`
   - `analysis-queue-processor.spec.ts`（重试分支）
   - `worker-main.spec.ts`
2. 绿灯：
   - `pnpm --filter @gitinsight/api test:unit -- analysis-job-queue.dispatcher.spec.ts`
   - `pnpm --filter @gitinsight/worker test:unit -- analysis-queue-processor.spec.ts`
   - `pnpm --filter @gitinsight/worker test:unit -- worker-main.spec.ts`
3. 全量可行回归：
   - `pnpm test`
   - `pnpm --filter @gitinsight/worker test:unit`
   - `pnpm --filter @gitinsight/api test:unit`
   - `pnpm --filter @gitinsight/api test:e2e`
