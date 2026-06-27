# GitInsight M2 任务状态持久化联动计划（2026-06-25）

## 1. 背景
- M1 阶段 `analysis-jobs` 仅提供内存级任务创建与查询，缺少可扩展的状态字段与持久化抽象。
- M2 首个切片目标是先把任务状态模型稳定下来，为后续 API/Worker/DB 全链路打通做准备。

## 2. 本次目标
1. 扩展任务响应结构，补齐进度、错误、时间戳等状态字段。
2. 引入任务仓储抽象，统一 create/get/updateStatus 能力，避免业务层耦合具体存储。
3. 完善状态推进最小链路（`RUNNING_DEEP -> SUCCEEDED`）测试覆盖。
4. 同步 Prisma 模型契约，预留后续持久化字段。

## 3. 实现范围
- API:
  - `analysis-job-response.dto.ts` 扩展字段。
  - `analysis-jobs.service.ts` 改为通过 store 抽象读写。
  - 新增 `analysis-job.store.ts` 接口定义。
  - 新增 `in-memory-analysis-job.store.ts` 实现。
- Worker:
  - 扩展状态机：`RUNNING_DEEP` 可推进到 `SUCCEEDED`。
- Data:
  - `prisma/schema.prisma` 中 `AnalysisJob` 增补 `progress`、`errorMessage`、`startedAt`、`finishedAt`、`updatedAt`。

## 4. TDD 验证清单
1. 红灯：
   - `analysis-jobs.e2e-spec.ts` 新增状态字段断言失败。
   - `schema-contract.spec.ts` 新增字段契约断言失败。
2. 绿灯：
   - `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`
   - `pnpm --filter @gitinsight/api test:unit -- prisma/schema-contract.spec.ts`
   - `pnpm --filter @gitinsight/worker test:unit -- analysis-state-machine.spec.ts`

## 5. 风险与后续
- 当前仍为内存 store，尚未接入真实 Prisma Repository 实现。
- 下一步将新增 Prisma store 并由配置切换，打通 API 创建任务后由 Worker 消费更新状态。
