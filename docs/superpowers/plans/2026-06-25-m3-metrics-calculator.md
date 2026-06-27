# M3.3: 9项指标计算模块

**日期**: 2026-06-25
**状态**: ✅ 已完成

## 目标

根据 SPEC 5.3 实现全部 9 项指标的完整计算逻辑。

## 改动清单

### 新增文件
- `apps/worker/src/metrics/metrics-calculator.service.ts` — 指标计算模块
- `apps/worker/test/metrics-calculator.service.spec.ts` — 单元测试

### 9 项指标

| # | 指标 | 计算方式 |
|---|------|----------|
| 1 | delivery_throughput | 窗口内总提交 / 周数 |
| 2 | lead_time_proxy | 时间跨度中位（小时） |
| 3 | review_response_time | 提交间隔中位时间（小时） |
| 4 | review_completion_time | 同 lead_time 近似 |
| 5 | active_contributors | 提交 >= 5 次的人数 |
| 6 | bus_factor_risk | Top 2 贡献占比（%） |
| 7 | hotspot_volatility | 高频文件变更热度（0-100） |
| 8 | rework_ratio | 修改已有文件的提交占比（%） |
| 9 | health_score | 前 8 项归一化加权分（0-100） |

### 风险等级
每项指标输出 `green`/`yellow`/`red` 风险等级

### 测试覆盖
- 8 条提交样本覆盖全部 9 项指标
- 空 commit 列表
- 单人贡献者边界
- 风险等级枚举验证

## 验证

- `pnpm --filter @gitinsight/worker test:unit` — 9 suites, 27 tests PASS
