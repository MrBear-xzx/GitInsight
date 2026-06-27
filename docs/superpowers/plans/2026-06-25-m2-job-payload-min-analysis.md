# M2: Payload 分发路径与最小分析指标

**日期**: 2026-06-25  
**状态**: ✅ 已完成

## 目标

补齐分析任务从创建到分发的 Payload 字段传递链路，并在 Worker 端生成最小分析指标摘要。

## 改动清单

### API 层
- `analysis-jobs.service.ts`：`create()` 方法将 DTO 字段作为 payload 传入分发器
- `analysis-job.dispatcher.ts`：`dispatch(jobId, payload)` 接口增加 payload 参数
- `analysis-job-inline.dispatcher.ts`：适配新接口（忽略 payload）
- `analysis-job-queue.dispatcher.ts`：适配新接口，payload 写入队列消息
- `create-analysis-job.dto.ts`：补充 `@ApiProperty` 装饰器

### Worker 层
- `min-analysis-metrics.ts`：新增 `buildMinimalMetricsSummary(payload)` 生成指标摘要
- `analysis-queue.processor.ts`：任务成功后调用 `buildMinimalMetricsSummary` 写入 `metrics_summary`

### 测试
- `analysis-job-queue.dispatcher.spec.ts`：适配新接口
- `analysis-queue-processor.spec.ts`：验证 retry + metrics_summary 分支
- `min-analysis-metrics.spec.ts`：新模块单元测试
- `docs-openapi.e2e-spec.ts`：验证 OpenAPI schema 字段暴露

## 验证

- `pnpm --filter @gitinsight/worker test:unit` — 6 suites, 10 tests PASS
- `pnpm --filter @gitinsight/api test:unit` — 全部通过
- `pnpm --filter @gitinsight/api test:e2e` — docs-openapi 通过
