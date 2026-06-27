# Analysis Job 自动处理联动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不引入新基础设施依赖的前提下，实现任务创建后可配置自动推进到完成态（SUCCEEDED）。

**Architecture:** 新增 `AnalysisJobOrchestrator` 负责按固定状态序列推进任务；`AnalysisJobsService` 在创建任务后按环境开关决定是否调用 orchestrator。自动处理复用现有 store 抽象，兼容 memory/prisma。

**Tech Stack:** NestJS, TypeScript, Jest (unit/e2e), existing AnalysisJobStore abstraction

---

## Task 1: 自动处理场景失败测试（E2E）

**Files:**
- Modify: `apps/api/test/analysis-jobs.e2e-spec.ts`
- Test: `apps/api/test/analysis-jobs.e2e-spec.ts`

- [ ] **Step 1: 写失败测试（自动处理开启后状态为 SUCCEEDED）**

```ts
it("auto-processes job to succeeded when feature flag enabled", async () => {
  process.env.ANALYSIS_JOB_AUTOPROCESS = "true";
  const createRes = await request(app.getHttpServer())
    .post("/api/v1/analysis-jobs")
    .send({
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
    });
  expect(createRes.body.status).toBe("SUCCEEDED");
  expect(createRes.body.progress).toBe(100);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`  
Expected: `FAIL`，当前仍返回 `PENDING`。

## Task 2: Orchestrator 单元失败测试

**Files:**
- Create: `apps/api/src/modules/analysis-jobs/analysis-job.orchestrator.ts`
- Create: `apps/api/test/analysis-job.orchestrator.spec.ts`
- Test: `apps/api/test/analysis-job.orchestrator.spec.ts`

- [ ] **Step 1: 写失败测试（状态推进顺序）**

```ts
it("updates status in expected order", async () => {
  const updateStatus = jest.fn();
  const orchestrator = new AnalysisJobOrchestrator({ updateStatus } as never);
  await orchestrator.runToCompletion("job_1");
  expect(updateStatus).toHaveBeenNthCalledWith(1, "job_1", "RUNNING_QUICK");
  expect(updateStatus).toHaveBeenNthCalledWith(2, "job_1", "QUICK_DONE");
  expect(updateStatus).toHaveBeenNthCalledWith(3, "job_1", "RUNNING_DEEP");
  expect(updateStatus).toHaveBeenNthCalledWith(4, "job_1", "SUCCEEDED");
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @gitinsight/api test:unit -- analysis-job.orchestrator.spec.ts`  
Expected: `FAIL`，orchestrator 尚未实现。

## Task 3: 最小实现自动处理联动

**Files:**
- Create: `apps/api/src/modules/analysis-jobs/analysis-job.orchestrator.ts`
- Modify: `apps/api/src/modules/analysis-jobs/analysis-jobs.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: 实现 orchestrator 最小代码**

```ts
const FLOW: AnalysisJobStatus[] = [
  "RUNNING_QUICK",
  "QUICK_DONE",
  "RUNNING_DEEP",
  "SUCCEEDED",
];

for (const status of FLOW) {
  await this.analysisJobsService.updateStatus(jobId, status);
}
```

- [ ] **Step 2: 在 service.create 中接入开关**

```ts
const job = await this.store.create(dto);
if (process.env.ANALYSIS_JOB_AUTOPROCESS === "true") {
  await this.orchestrator.runToCompletion(job.job_id);
  return (await this.store.get(job.job_id)) ?? job;
}
return job;
```

- [ ] **Step 3: 运行定向测试确认通过**

Run:
- `pnpm --filter @gitinsight/api test:unit -- analysis-job.orchestrator.spec.ts`
- `pnpm --filter @gitinsight/api test:e2e -- analysis-jobs.e2e-spec.ts`  
Expected: `PASS`。

## Task 4: 文档同步与提交前回归

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-24-gitinsight-v1-spec.md`
- Create: `docs/superpowers/plans/2026-06-25-m2-analysis-job-autoprocess-plan.md`

- [ ] **Step 1: 同步当前能力说明**

```md
- 新增可配置自动处理：`ANALYSIS_JOB_AUTOPROCESS=true` 时，任务创建后自动推进到完成态。
```

- [ ] **Step 2: 执行提交前全量可行回归**

Run:
- `pnpm test`
- `pnpm --filter @gitinsight/worker test:unit`
- `pnpm --filter @gitinsight/api test:unit`
- `pnpm --filter @gitinsight/api test:e2e`  
Expected: 全部通过。

- [ ] **Step 3: 提交**

```bash
git add apps/api README.md docs/superpowers/specs docs/superpowers/plans
git commit -m "feat(m2): 支持任务创建后自动状态推进联动"
```
