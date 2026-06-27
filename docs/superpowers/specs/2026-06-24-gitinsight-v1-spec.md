# GitInsight V1 详细规格说明（SPEC）

## 1. 文档信息
- 文档名称：GitInsight V1 SPEC
- 文档日期：2026-06-24
- 文档状态：待评审
- 关联 PRD：`docs/superpowers/specs/2026-06-24-gitinsight-v1-design.md`

## 1.1 技术选型冻结（V1）
1. 前端：`Next.js + TypeScript + ECharts`
2. 后端：`NestJS + TypeScript`
3. 数据库：`PostgreSQL`
4. ORM：`Prisma`
5. 任务队列与定时：`Redis + BullMQ`
6. GitHub 接入：`Octokit`
7. 仓库分析：`git CLI`（克隆与日志解析）
8. 接口文档：`Swagger (/docs)`
9. 测试：`Vitest/Jest`（单元与集成），`Playwright`（后续 E2E）

## 1.2 Docker 范围（V1）
1. 提供开发环境 `docker-compose`，至少包含：`postgres`、`redis`、`api`、`worker`。
2. 提供后端应用 `Dockerfile`，支持本地构建与 CI 镜像构建。
3. V1 不包含 Kubernetes 编排与复杂多环境部署模板。

## 2. 目标与范围
本 SPEC 将 PRD 中已确认范围转化为可执行规格，覆盖：
1. 功能规格（页面、流程、任务状态机、指标产出）。
2. 接口规格（任务创建、任务查询、看板读取）。
3. 数据规格（核心实体、字段约束、索引建议）。
4. 质量规格（性能、可靠性、安全、可观测性验收线）。

V1 范围外能力（多平台接入、PAT 持久化、多租户权限体系）不在本 SPEC 实现范围内。

## 3. 关键业务约束
1. 第一优先用户为团队管理者。
2. 首屏默认 90 天窗口，且支持 30/90/180 天切换。
3. 仪表盘默认展示 9 个核心指标卡。
4. 私有仓库鉴权使用 PAT，且仅会话内使用，不落库。
5. 分析流程必须是“快速层先出 + 深度层补齐”。
6. 同时支持手动触发与定时触发，口径一致。

## 4. 系统流程规格
## 4.1 用户主流程
1. 用户输入仓库 URL（可选 PAT）并提交分析。
2. 系统创建任务并进入 `PENDING`。
3. 任务执行快速层，状态进入 `RUNNING_QUICK`。
4. 快速层完成后状态进入 `QUICK_DONE`，前端显示首屏结果。
5. 深度层执行，状态进入 `RUNNING_DEEP`。
6. 深度层完成后状态进入 `SUCCEEDED`，看板补齐全量指标。

## 4.2 异常流程
1. 网络或平台限流等可恢复异常：进入 `FAILED_RETRYABLE` 并按重试策略处理。
2. PAT 无效、仓库不可达等不可恢复异常：进入 `FAILED_FINAL` 并返回可读错误提示。
3. 深度层超时：任务状态保持 `SUCCEEDED` 且 `partial=true`，前端展示“部分指标延迟”。

## 5. 指标计算规格
## 5.1 统一规则
1. 所有指标按 `repo + time_window + snapshot_time` 版本化。
2. 默认采用 UTC 存储时间，展示层按用户时区转换。
3. 指标输出需携带 `value`、`trend`、`risk_level`、`data_freshness`。

## 5.2 九项指标输出字段
每项指标统一字段：
- `metric_key`：唯一键。
- `display_name`：展示名。
- `value`：当前值。
- `unit`：单位。
- `window`：`30d|90d|180d`。
- `trend_pct`：环比百分比。
- `risk_level`：`green|yellow|red`。
- `data_freshness`：数据新鲜度（秒）。
- `updated_at`：计算时间。

## 5.3 指标最小可用口径（V1）
1. `delivery_throughput`：窗口内周均有效提交数。
2. `lead_time_proxy`：首次提交到主干合入中位时长（小时）。
3. `review_response_time`：发起到首评中位时长（小时）。
4. `review_completion_time`：发起到完成评审合入中位时长（小时）。
5. `active_contributors`：提交次数 >= 阈值（默认 5）的贡献者人数。
6. `bus_factor_risk`：Top N 贡献占比（默认 N=2）映射风险。
7. `hotspot_volatility`：热点文件波动评分（0-100）。
8. `rework_ratio`：短窗内重复修改占比（0-1）。
9. `health_score`：前 8 指标归一化加权分（0-100）。

## 6. API 规格（V1）
## 6.1 创建分析任务
- Method：`POST /api/v1/analysis-jobs`
- Request（JSON）
```json
{
  "repo_url": "https://github.com/org/repo",
  "pat": "ghp_xxx_optional",
  "time_window": "90d",
  "trigger_type": "manual"
}
```
- Response（202）
```json
{
  "job_id": "job_20260624_xxx",
  "status": "PENDING",
  "accepted_at": "2026-06-24T08:00:00Z"
}
```

## 6.2 查询任务状态
- Method：`GET /api/v1/analysis-jobs/{job_id}`
- Response（200）
```json
{
  "job_id": "job_20260624_xxx",
  "status": "RUNNING_DEEP",
  "progress": 72,
  "partial": false,
  "error_code": null,
  "error_message": null,
  "started_at": "2026-06-24T08:00:02Z",
  "updated_at": "2026-06-24T08:01:10Z"
}
```

## 6.3 读取看板快照
- Method：`GET /api/v1/dashboard?repo_id={repo_id}&window=90d`
- Response（200）
```json
{
  "repo_id": "repo_xxx",
  "window": "90d",
  "snapshot_type": "quick",
  "metrics": [
    {
      "metric_key": "delivery_throughput",
      "display_name": "交付吞吐",
      "value": 128,
      "unit": "commits/week",
      "trend_pct": 0.13,
      "risk_level": "yellow",
      "data_freshness": 45,
      "updated_at": "2026-06-24T08:01:00Z"
    }
  ]
}
```

## 7. 数据模型规格（逻辑）
## 7.1 表：`repositories`
1. `id`（PK）
2. `organization_id`（预留）
3. `repo_url`（唯一）
4. `provider`（固定为 `github`）
5. `is_private`
6. `created_at`

## 7.2 表：`analysis_jobs`
1. `id`（PK）
2. `repo_id`（FK）
3. `trigger_type`（`manual|scheduled`）
4. `status`
5. `time_window`
6. `partial`（默认 `false`）
7. `error_code`
8. `error_message`
9. `started_at`
10. `finished_at`
11. `created_at`

## 7.3 表：`analysis_snapshots`
1. `id`（PK）
2. `repo_id`（FK）
3. `job_id`（FK）
4. `snapshot_type`（`quick|full`）
5. `time_window`
6. `metrics_json`（JSON）
7. `created_at`

## 7.4 索引建议
1. `analysis_jobs(repo_id, created_at desc)`
2. `analysis_jobs(status, created_at desc)`
3. `analysis_snapshots(repo_id, time_window, created_at desc)`

## 8. 非功能规格（NFR）
1. 性能：快速层结果应在 60 秒内返回（P90，基于中等规模仓库）。
2. 性能：深度层应在 10 分钟内完成（P90，基于中等规模仓库）。
3. 可用性：任务调度服务月可用性目标 99.5%。
4. 安全：PAT 不落盘、不入日志，进程内使用后立即清理内存引用。
5. 可观测性：任务阶段耗时、失败原因、重试次数必须可查询。

## 9. 错误码规格
1. `AUTH_INVALID_PAT`：PAT 无效或过期。
2. `REPO_NOT_FOUND`：仓库不存在或无权限访问。
3. `GITHUB_RATE_LIMITED`：平台限流。
4. `CLONE_FAILED`：克隆失败。
5. `ANALYSIS_TIMEOUT`：分析超时。
6. `INTERNAL_ERROR`：未分类内部异常。

## 10. 测试验收规格
1. 指标单元测试：9 指标至少各 1 组正常样例 + 1 组边界样例。
2. 状态机测试：7 个核心状态流转与失败分支覆盖。
3. 接口测试：创建任务、查任务、读快照三接口成功与失败路径。
4. 回归测试：返工率、热点波动、Bus Factor 三项必须有固定样本回归。
5. 文档验收：`/docs` 可见接口字段、错误码、示例请求响应。

## 11. 发布准入（与质量规范联动）
1. PR 合并前必须通过 CI 全量检查。
2. 不满足安全要求（PAT 日志泄露）禁止发布。
3. 任一核心指标计算失败率高于阈值（默认 1%）禁止发布。

## 12. M1 当前实现映射（截至 2026-06-25）
1. 已实现：
   - `POST /api/v1/analysis-jobs`
   - `GET /api/v1/analysis-jobs/:jobId`
   - `GET /api/v1/dashboard`
   - worker 状态机最小实现 `nextStates("PENDING")`
   - 快速层最小三项指标计算骨架
   - PAT 掩码函数 `maskToken`
   - Docker `compose` + `api/worker` Dockerfile
   - `app-ci.yml`（unit + integration）
2. 待增强：
   - API 与 worker 间队列联动（当前以最小闭环桩数据为主）
   - dashboard 指标从真实快照读取（当前返回最小演示结构）
