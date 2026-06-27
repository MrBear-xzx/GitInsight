# GitInsight M2 真实队列联动与失败分支回归计划（2026-06-25）

## 背景
- 已实现 `ANALYSIS_JOB_AUTOPROCESS` 自动推进，但默认为 inline 同步编排。
- 需要引入“可切换队列分发模式”，并补齐失败态回归测试，作为后续 BullMQ 实消费接入过渡层。

## 目标
1. 新增 dispatcher 抽象，支持 `inline` 与 `queue` 两种分发模式。
2. 在 `queue` 模式下，创建任务后进入处理状态（最小联动），保留当前 API 行为可验证。
3. 新增 worker 侧队列处理器最小实现，覆盖成功与失败分支（`FAILED_FINAL`）。

## 实施
1. API：
   - 新增 `AnalysisJobDispatcher` 接口。
   - 新增 `AnalysisJobInlineDispatcher`、`AnalysisJobQueueDispatcher`。
   - 新增 `analysis-job-dispatcher.provider.ts`，按 `ANALYSIS_JOB_DISPATCH_MODE` 切换实现。
   - `AnalysisJobsService` 从直接调用 orchestrator 改为调用 dispatcher。
2. Worker：
   - 新增 `analysis-queue.processor.ts`，按固定流程推进状态。
   - 在异常时写入：
     - `status=FAILED_FINAL`
     - `error_code=INTERNAL_ERROR`
     - `error_message=simulated queue failure`

## 测试
1. 红灯：
   - `analysis-job-dispatcher.provider.spec.ts`（目标文件不存在）
   - `analysis-queue-processor.spec.ts`（目标文件不存在）
2. 绿灯：
   - `pnpm --filter @gitinsight/api test:unit -- analysis-job-dispatcher.provider.spec.ts`
   - `pnpm --filter @gitinsight/worker test:unit -- analysis-queue-processor.spec.ts`
3. 全量可行回归：
   - `pnpm test`
   - `pnpm --filter @gitinsight/worker test:unit`
   - `pnpm --filter @gitinsight/api test:unit`
   - `pnpm --filter @gitinsight/api test:e2e`
