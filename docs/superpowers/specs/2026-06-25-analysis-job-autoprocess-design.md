# GitInsight Analysis Job 自动处理联动设计（M2）

## 1. 背景
- 当前 `analysis-jobs` 已支持状态字段与可切换 store（memory/prisma），但创建任务后仍停留在 `PENDING`。
- Worker 真实队列消费链路尚未打通，需要一个不依赖额外基础设施的最小端到端联动能力。

## 2. 目标
1. 在配置开启时，任务创建后自动推进状态，最终达到 `SUCCEEDED`。
2. 自动推进逻辑复用现有状态模型与 store（memory/prisma 均可生效）。
3. 默认保持现状（不开启自动处理），避免破坏当前行为。

## 3. 方案
1. 新增 `AnalysisJobOrchestrator`：
   - 输入：`job_id`
   - 行为：按顺序调用 `AnalysisJobsService.updateStatus`：
     - `RUNNING_QUICK`
     - `QUICK_DONE`
     - `RUNNING_DEEP`
     - `SUCCEEDED`
2. 在 `AnalysisJobsService.create` 中增加开关：
   - `ANALYSIS_JOB_AUTOPROCESS=true` 时触发 orchestrator
   - 其他情况保持仅创建 `PENDING`
3. 触发策略：
   - 采用“创建后即触发”的最小同步调用，确保测试可稳定断言
   - 不引入 Redis/BullMQ 运行时依赖

## 4. 接口与兼容性
- `POST /api/v1/analysis-jobs`：
  - 默认：返回 `PENDING`
  - 开启自动处理：返回最终状态（`SUCCEEDED`）
- `GET /api/v1/analysis-jobs/:jobId`：
  - 默认：查询到 `PENDING`
  - 开启自动处理：查询到 `SUCCEEDED`

## 5. 测试策略
1. e2e 新增自动处理场景（环境开关开启）。
2. 单测新增 orchestrator 流程顺序测试。
3. 保留原有默认行为测试，避免回归。

## 6. 风险与后续
- 风险：同步推进不是最终异步队列形态，仅用于当前阶段连通验证。
- 后续：替换 orchestrator 执行入口为真实队列入队与 worker 消费，同时保留状态推进顺序与字段口径。
