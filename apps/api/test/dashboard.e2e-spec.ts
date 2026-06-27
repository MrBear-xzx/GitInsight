import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { ANALYSIS_JOB_STORE_TOKEN } from "../src/modules/analysis-jobs/analysis-job-store.provider";
import { AnalysisJobStore } from "../src/modules/analysis-jobs/analysis-job.store";

describe("Dashboard E2E", () => {
  let app: INestApplication;
  let store: AnalysisJobStore;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    store = app.get(ANALYSIS_JOB_STORE_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns fallback metrics when no succeeded job exists", async () => {
    const res = await request(app.getHttpServer()).get(
      "/api/v1/dashboard?repo_id=repo_xxx&window=90d"
    );
    expect(res.status).toBe(200);
    expect(res.body.snapshot_type).toBe("quick");
    expect(Array.isArray(res.body.metrics)).toBe(true);
    expect(res.body.metrics.length).toBeGreaterThanOrEqual(3);
  });

  it("returns real metrics from latest succeeded job", async () => {
    const job = await store.create({
      repo_url: "https://github.com/org/repo",
      time_window: "90d",
      trigger_type: "manual",
    });

    await store.updateStatus({
      job_id: job.job_id,
      status: "SUCCEEDED",
      metrics_summary: {
        delivery_throughput: 42,
        active_contributors: 5,
        health_score: 88,
      },
    });

    const res = await request(app.getHttpServer()).get(
      "/api/v1/dashboard?repo_id=https://github.com/org/repo&window=90d"
    );
    expect(res.status).toBe(200);
    expect(res.body.metrics[0].value).toBe(42);
  });
});
