# M3.5: 打通Worker完整分析链路

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

将克隆、日志解析、指标计算串为完整管道，并集成到 Worker processor 中，使分析任务真正执行端到端分析流程。

## 改动清单

### 新增文件
- `apps/worker/src/orchestrators/analysis-orchestrator.service.ts`
- `apps/worker/test/analysis-orchestrator.service.spec.ts`

### 修改文件
- `apps/worker/src/processors/analysis-queue.processor.ts` — 集成真实分析管线
- `apps/worker/test/analysis-queue-processor.spec.ts` — 适配新错误处理语义

### 架构

```text
AnalysisJob (PENDING)
  → processAnalysisJob() → RUNNING_QUICK
    → runFullAnalysis()
      → cloneRepo() → repo 本地路径
      → parseGitLog() → CommitRecord[]
      → calculateAllMetrics() → MetricResult[9]
    → metricsToSummary() → metrics_summary
  → QUICK_DONE → RUNNING_DEEP → SUCCEEDED (含指标)
```

### 错误处理

| 场景 | 错误码 | 重试行为 |
|------|--------|----------|
| 仓库不存在 | REPO_NOT_FOUND | FAILED_FINAL（不重试） |
| PAT 无效 | AUTH_INVALID_PAT | FAILED_FINAL |
| 速率限制 | GITHUB_RATE_LIMITED | FAILED_RETRYABLE |
| 克隆失败 | CLONE_FAILED | FAILED_RETRYABLE |
| 其他错误 | INTERNAL_ERROR | 按重试策略 |

### 测试覆盖
- Orchestrator：正常编排、PAT 传递、错误转发
- metricsToSummary：格式转换、空数组
- Processor：legacy 路径（无 payload）、重试+失败语义（适配 catch 重新抛出）

## 验证

- pnpm --filter @gitinsight/worker test:unit — 10 suites, 32 tests PASS
- pnpm --filter @gitinsight/api test:unit — 10 suites, 17 tests PASS
- pnpm --filter @gitinsight/api test:e2e — 4 suites, 8 tests PASS
