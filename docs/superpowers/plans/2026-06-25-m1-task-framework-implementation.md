# M1 任务框架与仓库接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 GitInsight V1 的 M1 可运行闭环：仓库接入、任务创建与状态查询、快速层结果可读、基础 Docker 开发环境可启动。

**Architecture:** 采用单仓 monorepo。`apps/api` 提供 REST API 与 `/docs`；`apps/worker` 负责队列消费、状态机推进、快速指标计算；`apps/web` 提供最小看板页面。PostgreSQL 存储仓库、任务与快照，Redis 承载 BullMQ 队列与定时任务。

**Tech Stack:** Next.js + NestJS + TypeScript + Prisma + PostgreSQL + Redis + BullMQ + Octokit + git CLI + Swagger + Vitest/Jest

---

## 文件结构（M1）

- `package.json`：根脚本与 workspace 配置。
- `pnpm-workspace.yaml`：workspace 范围。
- `tsconfig.base.json`：统一 TS 配置。
- `apps/api/*`：API 服务（NestJS）。
- `apps/worker/*`：异步任务服务（BullMQ Worker）。
- `apps/web/*`：最小看板页面（Next.js）。
- `packages/shared/*`：共享类型、状态枚举、错误码。
- `packages/config/*`：共享配置（env schema、logger 配置）。
- `prisma/schema.prisma`：数据库模型。
- `docker-compose.yml`：开发环境容器。
- `apps/api/Dockerfile`、`apps/worker/Dockerfile`：后端镜像构建。
- `.github/workflows/app-ci.yml`：应用级 CI（测试与构建）。

### Task 1: 初始化 Monorepo 与基础骨架

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/api/package.json`
- Create: `apps/worker/package.json`
- Create: `apps/web/package.json`
- Create: `packages/shared/package.json`
- Create: `packages/config/package.json`
- Test: `tests/smoke/workspace-structure.test.ts`

- [ ] **Step 1: 写失败测试（工作区结构）**

```ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace structure", () => {
  it("contains required app and package folders", () => {
    expect(existsSync("apps/api")).toBe(true);
    expect(existsSync("apps/worker")).toBe(true);
    expect(existsSync("apps/web")).toBe(true);
    expect(existsSync("packages/shared")).toBe(true);
    expect(existsSync("packages/config")).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest tests/smoke/workspace-structure.test.ts`  
Expected: `FAIL`，提示目录不存在。

- [ ] **Step 3: 实现最小骨架**

```json
{
  "name": "gitinsight",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "test": "pnpm -r test",
    "lint:docs": "echo docs lint in separate workflow"
  }
}
```

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tests/*"
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm vitest tests/smoke/workspace-structure.test.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json apps packages tests
git commit -m "feat(m1): 初始化monorepo基础骨架"
```

### Task 2: API 服务最小可运行（健康检查 + Swagger）

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/test/health.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（健康检查）**

```ts
it("/health returns service status", async () => {
  const res = await request(app.getHttpServer()).get("/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "ok", service: "api" });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/api test:e2e -- health.e2e-spec.ts`  
Expected: `FAIL`，提示路由不存在。

- [ ] **Step 3: 实现最小代码**

```ts
@Controller()
export class HealthController {
  @Get("/health")
  health() {
    return { status: "ok", service: "api" };
  }
}
```

```ts
const app = await NestFactory.create(AppModule);
const config = new DocumentBuilder().setTitle("GitInsight API").build();
SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
await app.listen(3000);
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/api test:e2e -- health.e2e-spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add apps/api
git commit -m "feat(api): 新增健康检查与Swagger入口"
```

### Task 3: 数据模型与 Prisma 基础落库

**Files:**
- Create: `prisma/schema.prisma`
- Create: `apps/api/src/modules/repositories/repository.entity.ts`
- Create: `apps/api/src/modules/analysis-jobs/analysis-job.entity.ts`
- Create: `apps/api/src/modules/analysis-snapshots/analysis-snapshot.entity.ts`
- Create: `apps/api/test/prisma/schema-contract.spec.ts`
- Test: `apps/api/test/prisma/schema-contract.spec.ts`

- [ ] **Step 1: 写失败测试（模型关键字段）**

```ts
it("contains required models and status field", async () => {
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  expect(schema).toContain("model Repository");
  expect(schema).toContain("model AnalysisJob");
  expect(schema).toContain("status");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/api test -- schema-contract.spec.ts`  
Expected: `FAIL`，`schema.prisma` 不存在。

- [ ] **Step 3: 实现最小模型**

```prisma
model Repository {
  id         String   @id @default(cuid())
  repoUrl    String   @unique
  provider   String   @default("github")
  isPrivate  Boolean
  createdAt  DateTime @default(now())
  jobs       AnalysisJob[]
}

model AnalysisJob {
  id          String   @id @default(cuid())
  repoId      String
  status      String
  triggerType String
  timeWindow  String
  partial     Boolean  @default(false)
  errorCode   String?
  createdAt   DateTime @default(now())
  repository  Repository @relation(fields: [repoId], references: [id])
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/api test -- schema-contract.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add prisma apps/api/src/modules apps/api/test/prisma
git commit -m "feat(db): 新增M1核心数据模型"
```

### Task 4: 创建任务与查询任务 API（状态机起点）

**Files:**
- Create: `apps/api/src/modules/analysis-jobs/analysis-jobs.controller.ts`
- Create: `apps/api/src/modules/analysis-jobs/analysis-jobs.service.ts`
- Create: `apps/api/src/modules/analysis-jobs/dto/create-analysis-job.dto.ts`
- Create: `apps/api/src/modules/analysis-jobs/dto/analysis-job-response.dto.ts`
- Create: `apps/api/test/analysis-jobs.e2e-spec.ts`
- Test: `apps/api/test/analysis-jobs.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（POST + GET）**

```ts
it("creates analysis job and returns PENDING", async () => {
  const createRes = await request(app.getHttpServer())
    .post("/api/v1/analysis-jobs")
    .send({ repo_url: "https://github.com/org/repo", time_window: "90d", trigger_type: "manual" });
  expect(createRes.status).toBe(202);
  expect(createRes.body.status).toBe("PENDING");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`  
Expected: `FAIL`，接口不存在。

- [ ] **Step 3: 实现最小代码**

```ts
@Post("/api/v1/analysis-jobs")
create(@Body() dto: CreateAnalysisJobDto) {
  return this.analysisJobsService.create(dto);
}

@Get("/api/v1/analysis-jobs/:jobId")
get(@Param("jobId") jobId: string) {
  return this.analysisJobsService.get(jobId);
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/modules/analysis-jobs apps/api/test/analysis-jobs.e2e-spec.ts
git commit -m "feat(api): 新增任务创建与查询接口"
```

### Task 5: Worker 状态机与队列推进（Quick/Deep）

**Files:**
- Create: `apps/worker/src/main.ts`
- Create: `apps/worker/src/queues/analysis.queue.ts`
- Create: `apps/worker/src/processors/analysis.processor.ts`
- Create: `apps/worker/test/analysis-state-machine.spec.ts`
- Modify: `apps/api/src/modules/analysis-jobs/analysis-jobs.service.ts`
- Test: `apps/worker/test/analysis-state-machine.spec.ts`

- [ ] **Step 1: 写失败测试（状态流转）**

```ts
it("moves job from PENDING to QUICK_DONE then RUNNING_DEEP", async () => {
  const history = await runStateMachine(["PENDING"]);
  expect(history).toEqual(["RUNNING_QUICK", "QUICK_DONE", "RUNNING_DEEP"]);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/worker test -- analysis-state-machine.spec.ts`  
Expected: `FAIL`，状态机实现缺失。

- [ ] **Step 3: 实现最小代码**

```ts
export const nextStates = (current: string) => {
  if (current === "PENDING") return ["RUNNING_QUICK", "QUICK_DONE", "RUNNING_DEEP"];
  return [];
};
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/worker test -- analysis-state-machine.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add apps/worker apps/api/src/modules/analysis-jobs
git commit -m "feat(worker): 新增任务状态机与队列处理骨架"
```

### Task 6: 仓库接入与 PAT 会话安全处理

**Files:**
- Create: `apps/worker/src/services/git-clone.service.ts`
- Create: `apps/worker/src/services/github-client.service.ts`
- Create: `apps/worker/test/pat-safety.spec.ts`
- Test: `apps/worker/test/pat-safety.spec.ts`

- [ ] **Step 1: 写失败测试（PAT 不落日志）**

```ts
it("never logs raw pat token", async () => {
  const logs = await simulateCloneWithToken("ghp_1234567890abcdef");
  expect(logs.join(" ")).not.toContain("ghp_1234567890abcdef");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/worker test -- pat-safety.spec.ts`  
Expected: `FAIL`，当前实现会打印原文或未实现。

- [ ] **Step 3: 实现最小代码**

```ts
const maskToken = (token: string) => `${token.slice(0, 2)}****${token.slice(-2)}`;
logger.info({ token: maskToken(pat) }, "cloning repository");
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/worker test -- pat-safety.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add apps/worker/src/services apps/worker/test/pat-safety.spec.ts
git commit -m "feat(security): 新增PAT会话安全处理"
```

### Task 7: 快速层指标最小集（3项）与看板读取

**Files:**
- Create: `apps/worker/src/metrics/quick-metrics.service.ts`
- Create: `apps/worker/test/quick-metrics.spec.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Create: `apps/api/test/dashboard.e2e-spec.ts`
- Test: `apps/worker/test/quick-metrics.spec.ts`
- Test: `apps/api/test/dashboard.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（指标计算）**

```ts
it("calculates throughput and active contributors", () => {
  const result = calculateQuickMetrics(sampleCommits);
  expect(result.delivery_throughput.value).toBeGreaterThan(0);
  expect(result.active_contributors.value).toBe(3);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/worker test -- quick-metrics.spec.ts`  
Expected: `FAIL`。

- [ ] **Step 3: 实现最小代码**

```ts
export function calculateQuickMetrics(commits: CommitRecord[]) {
  return {
    delivery_throughput: { value: commits.length, risk_level: "green" },
    active_contributors: { value: new Set(commits.map((c) => c.author)).size, risk_level: "green" },
    health_score: { value: 80, risk_level: "yellow" }
  };
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm --filter @gitinsight/worker test -- quick-metrics.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add apps/worker/src/metrics apps/worker/test apps/api/src/modules/dashboard apps/api/test/dashboard.e2e-spec.ts
git commit -m "feat(metrics): 新增快速层三项指标与看板接口"
```

### Task 8: Docker 开发环境（compose + Dockerfile）

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/api/Dockerfile`
- Create: `apps/worker/Dockerfile`
- Create: `.dockerignore`
- Create: `tests/smoke/docker-compose-config.spec.ts`
- Test: `tests/smoke/docker-compose-config.spec.ts`

- [ ] **Step 1: 写失败测试（compose 服务定义）**

```ts
it("contains postgres redis api worker services", () => {
  const compose = readFileSync("docker-compose.yml", "utf-8");
  expect(compose).toContain("postgres:");
  expect(compose).toContain("redis:");
  expect(compose).toContain("api:");
  expect(compose).toContain("worker:");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest tests/smoke/docker-compose-config.spec.ts`  
Expected: `FAIL`，compose 未创建。

- [ ] **Step 3: 实现最小配置**

```yaml
services:
  postgres:
    image: postgres:16
  redis:
    image: redis:7
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm vitest tests/smoke/docker-compose-config.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add docker-compose.yml apps/api/Dockerfile apps/worker/Dockerfile .dockerignore tests/smoke
git commit -m "feat(devops): 新增M1开发容器编排与镜像配置"
```

### Task 9: 文档与 CI 门禁对齐（应用层）

**Files:**
- Create: `.github/workflows/app-ci.yml`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-24-gitinsight-v1-spec.md`
- Create: `docs/superpowers/plans/2026-06-25-m1-execution-plan.md`
- Test: `.github/workflows/app-ci.yml`（PR 检查）

- [ ] **Step 1: 写失败测试（CI 门禁脚本 smoke）**

```ts
it("app-ci workflow includes unit and integration jobs", () => {
  const workflow = readFileSync(".github/workflows/app-ci.yml", "utf-8");
  expect(workflow).toContain("unit-test");
  expect(workflow).toContain("integration-test");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm vitest tests/smoke/app-ci-workflow.spec.ts`  
Expected: `FAIL`，workflow 不存在。

- [ ] **Step 3: 实现最小 workflow**

```yaml
name: App CI
on:
  pull_request:
    branches: [main]
jobs:
  unit-test:
    runs-on: ubuntu-latest
  integration-test:
    runs-on: ubuntu-latest
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `pnpm vitest tests/smoke/app-ci-workflow.spec.ts`  
Expected: `PASS`。

- [ ] **Step 5: 提交**

```bash
git add .github/workflows/app-ci.yml README.md docs/superpowers/specs docs/superpowers/plans
git commit -m "chore(ci): 新增应用级测试门禁并同步文档"
```

## 执行注意事项

1. 安装依赖前必须先向用户确认（包含 Node 包与系统级依赖）。
2. 每个任务提交前必须给用户展示改动摘要、验证方式和建议 commit message。
3. 任何接口字段变更必须同步 `/docs` 示例与 SPEC。
4. 合并策略固定为 `Squash and merge`，并删除远端任务分支。

