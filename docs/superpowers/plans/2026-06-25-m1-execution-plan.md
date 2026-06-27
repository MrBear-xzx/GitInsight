# GitInsight M1 执行进展记录（Task 1-9）

## 1. 目标
记录 M1 任务框架阶段（Task 1-9）的实际落地结果、测试证据与当前边界，作为后续 M2 的交接输入。

## 2. 已完成项
1. Monorepo 基础骨架（apps/packages/tests + workspace 配置）。
2. API 基础服务与 `/health`、`/docs`。
3. Prisma 核心模型与契约测试。
4. 任务创建/查询 API（PENDING 最小闭环）。
5. Worker 状态机与队列骨架。
6. PAT 掩码安全处理。
7. 快速层最小指标（吞吐、活跃贡献者、健康分）与 dashboard 读取接口。
8. Docker 开发编排（compose + API/Worker Dockerfile）。
9. 应用级 CI 工作流（unit-test + integration-test）。

## 3. 测试证据（本地定向）
1. Worker:
   - `analysis-state-machine.spec.ts` 通过
   - `pat-safety.spec.ts` 通过
   - `quick-metrics.spec.ts` 通过
2. API:
   - `health.e2e-spec.ts` 通过
   - `analysis-jobs.e2e-spec.ts` 通过
   - `dashboard.e2e-spec.ts` 通过
   - `schema-contract.spec.ts` 通过
3. Smoke:
   - `docker-compose-config.spec.ts` 通过
   - `app-ci-workflow.spec.ts` 通过

## 4. 当前边界说明
1. dashboard 当前返回最小演示结构，后续将切换到真实快照数据源。
2. 任务状态流转与队列骨架已具备，但尚未与真实 clone/分析全链路打通。
3. Prisma client 生成相关步骤待后续数据库联调阶段补齐。

## 5. 下一阶段建议（M2）
1. 打通 worker 与 API 的任务持久化联动（真实状态推进）。
2. 把 quick/full snapshot 从桩数据切换为数据库读取。
3. 增加限流、重试、错误码映射与可观测性埋点。
4. 引入最小前端看板页面，展示 9 卡中的已实现子集与任务进度。

