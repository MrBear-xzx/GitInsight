# GitInsight 性能测试计划

## 目标

- 快速层（Quick Layer）：单次分析 ≤ 60s（P50）
- 深层层（Deep Layer）：完整分析 ≤ 10min（P90）
- API 响应：健康检查 ≤ 500ms，看板查询 ≤ 3s

## 基准测试范围

### 1. 指标计算性能（已实现 — tests/performance/benchmark.spec.ts）

| 场景 | 数据量 | 期望 | 状态 |
|------|--------|------|------|
| 小规模 | 100 commits | ≤ 100ms | ✅ |
| 中等规模 | 1000 commits | ≤ 500ms | ✅ |
| 大规模 | 10000 commits | ≤ 5s | ✅ |

### 2. Git 日志解析性能（待实现 — 需 mock git 命令）

| 场景 | 数据量 | 期望 | 状态 |
|------|--------|------|------|
| 小规模 | 100 commits | ≤ 1s | ⏳ |
| 大规模 | 5000 commits | ≤ 10s | ⏳ |

### 3. API 端到端性能（待实现 — 需真实 API 运行）

| 场景 | 端点 | 期望 | 状态 |
|------|------|------|------|
| 健康检查 | GET /health | ≤ 500ms | ⏳ |
| 创建任务 | POST /analysis-jobs | ≤ 2s | ⏳ |
| 看板查询 | GET /dashboard | ≤ 3s | ⏳ |

## 执行方式

pnpm benchmark        # 运行所有性能测试
pnpm benchmark:watch  # watch 模式开发

## CI 集成

性能测试在 CI 中作为独立 job 运行（e2e-playwright），但不阻塞合并
（performance regression 只告警不阻断）。

## 基线记录

首次基线：2026-06-25 — 全部通过
