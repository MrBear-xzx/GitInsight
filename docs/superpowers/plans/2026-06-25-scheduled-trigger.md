# M5: 定时触发机制

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

支持通过环境变量配置定时分析，自动向配置的仓库列表发起分析任务。

## 改动清单

### 修改
- `analysis-jobs.service.ts` — 构造函数中启动 `startScheduledAnalysis`

### 配置方式

通过环境变量控制：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SCHEDULED_ANALYSIS_ENABLED` | 启用定时分析 | `false` |
| `SCHEDULED_ANALYSIS_INTERVAL_MS` | 间隔毫秒 | `21600000` (6h) |
| `SCHEDULED_ANALYSIS_REPOS` | 仓库列表 JSON | — |

### 示例

```json
# SCHEDULED_ANALYSIS_REPOS
[
  {"repo_url": "https://github.com/org/repo1", "time_window": "90d"},
  {"repo_url": "https://github.com/org/repo2", "time_window": "30d", "pat": "ghp_xxx"}
]
```

### 行为
1. 启动时立即执行一次
2. 按配置间隔循环执行
3. 任务以 `trigger_type: "scheduled"` 创建
4. 失败不影响后续仓库

## 验证

- pnpm --filter @gitinsight/api test:unit — 17 passed
- pnpm --filter @gitinsight/api test:e2e — 8 passed
- pnpm --filter @gitinsight/worker test:unit — 36 passed
