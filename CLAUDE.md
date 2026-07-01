# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GitInsight 是 Git 仓库分析 Web 应用，V1 核心链路已打通。详见 [README.md](README.md) 了解功能、指标定义和快速开始。

**协作约定**见 [AGENT.md](AGENT.md)：分支流程、提交规范、测试要求、安全边界等。CLAUDE.md 不再重复。

## 常用命令

### 安装与启动

```bash
pnpm install                        # 安装所有依赖
pnpm --filter @gitinsight/api dev    # 启动 API（端口 3000，内含分析执行）
pnpm --filter @gitinsight/web dev    # 启动前端（端口 3001）
```

Worker 不再作为独立进程启动，分析逻辑在 API 进程内同步执行。

### 测试

| 命令 | 说明 |
|------|------|
| `pnpm test` | Root 层 Vitest（smoke + 性能基准） |
| `pnpm --filter @gitinsight/worker test:unit` | Worker 单元测试 (Jest) |
| `pnpm --filter @gitinsight/api test:unit` | API 单元测试 (Jest) |
| `pnpm --filter @gitinsight/api test:e2e` | API E2E（Jest + supertest） |
| `pnpm test:e2e:playwright` | Playwright E2E（API + UI） |
| `pnpm test:e2e:playwright:ui` | Playwright UI 模式 |
| `pnpm benchmark` | 性能基准测试 |

## 架构

### Monorepo 结构

```text
apps/
├── api/     # NestJS REST API — 任务 CRUD + Dashboard + 内联分析执行
├── worker/  # 分析逻辑库 — git 克隆、日志解析、指标计算（由 API 直接 import 调用）
└── web/     # Next.js 前端 — 任务创建 + 看板展示
```

### 数据流

```
用户 POST /api/v1/analysis-jobs → 任务创建 (status: PENDING)
  → API 进程内同步执行
    → git clone（浅克隆）
    → git log --format + --numstat 解析
    → 9 项指标计算
    → metrics_summary 写入 → status: SUCCEEDED
  → 前端轮询状态 → 成功后跳转 /dashboard
  → GET /api/v1/dashboard → 渲染看板
```

### 作业状态机

```
PENDING → RUNNING_QUICK → QUICK_DONE → RUNNING_DEEP → SUCCEEDED
                                                    → FAILED_RETRYABLE
                                                    → FAILED_FINAL
```

定义在 [analysis-job-status.ts](apps/api/src/modules/analysis-jobs/analysis-job-status.ts)。

### API 模块 (`apps/api`)

NestJS 应用，入口 [main.ts](apps/api/src/main.ts)。

- `AppModule` — 简洁的 DI 注册：`InMemoryAnalysisJobStore` + `AnalysisJobInlineDispatcher` + 各 Service/Controller
- `HealthController` — 健康检查
- `AnalysisJobsController` + `AnalysisJobsService` — 任务 CRUD，创建后自动同步执行分析
- `AnalysisJobInlineDispatcher` — 接收 store，调用 `processAnalysisJob` 原地执行分析
- `AnalysisJobStore`（接口）→ `InMemoryAnalysisJobStore` — 内存存储，通过 `ANALYSIS_JOB_STORE_TOKEN` 注入
- `DashboardController` + `DashboardService` — 看板查询
- `GlobalExceptionFilter` — 全局异常过滤

所有分析逻辑在 API 进程内同步完成，无需外部队列或独立 Worker 进程。

### Worker 模块 (`apps/worker`)

纯逻辑库，入口 [main.ts](apps/worker/src/main.ts) 为空操作。核心服务由 API 直接 import：

- `git-clone.service.ts` — git clone + 深度控制
- `git-log-parser.service.ts` — `git log --format + --numstat` 解析
- `metrics-calculator.service.ts` — 9 项指标计算
- `quick-metrics.service.ts` — 快速指标（轻量阶段）
- `analysis-queue.processor.ts` — `processAnalysisJob()` 分析流程入口
- `analysis-orchestrator.service.ts` — `runFullAnalysis()` 编排克隆→解析→计算全流程

### 前端 (`apps/web`)

Next.js App Router 应用：

- `app/page.tsx` — 首页（任务创建：仓库 URL + PAT + 时间窗口输入）
- `app/dashboard/page.tsx` — 看板页（指标卡片 + 图表）
- `app/history/page.tsx` — 历史页（任务列表）
- `components/MetricCard.tsx` / `MetricChart.tsx` / `MetricGrid.tsx` — 指标展示组件
- `components/TaskForm.tsx` — 任务提交表单（仓库 URL / PAT / 时间窗口）
- `components/States.tsx` — 加载/空/错误状态组件
- `lib/api.ts` — API 客户端

图表使用 echarts + echarts-for-react。生产构建使用 Next.js standalone 输出模式。

## 环境变量

| 变量 | 默认值 | 作用 |
|------|--------|------|
| `PORT` | 3000 | API 端口 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | 前端 API 地址 |

## 测试架构

测试分层：

1. **Root Vitest** ([vitest.config.ts](vitest.config.ts)) — smoke 测试（workspace 结构、CI workflow、vitest scope）和性能基准测试
2. **API Jest 单元测试** — `apps/api/test/`，测试 Service/Controller
3. **API Jest E2E** — supertest 集成测试，需启动 NestJS 应用
4. **Worker Jest 单元测试** — `apps/worker/test/`，测试各分析 service 和 processor
5. **Playwright E2E** — 两个 project：`api`（直接调用 API）和 `ui`（浏览器页面测试）

CI 中按单元测试 → 集成测试 → Playwright E2E 的依赖顺序执行。

## API 端点

- `GET /health` — 健康检查
- `GET /docs` — Swagger 文档
- `POST /api/v1/analysis-jobs` — 创建分析任务
- `GET /api/v1/analysis-jobs` — 任务列表
- `GET /api/v1/analysis-jobs/:id` — 任务详情
- `GET /api/v1/dashboard?repo_id=&window=` — 看板数据
