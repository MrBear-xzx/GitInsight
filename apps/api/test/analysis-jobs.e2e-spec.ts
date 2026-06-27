import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Analysis Jobs E2E", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/analysis-jobs creates a job", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/analysis-jobs")
      .send({
        repo_url: "https://github.com/org/repo",
        time_window: "90d",
        trigger_type: "manual",
      });
    expect(res.status).toBe(202);
    expect(res.body.job_id).toBeDefined();
    expect(res.body.status).toBe("PENDING");
  });

  it("GET /api/v1/analysis-jobs returns job list", async () => {
    // Create two jobs first
    await request(app.getHttpServer())
      .post("/api/v1/analysis-jobs")
      .send({ repo_url: "https://github.com/org/a", time_window: "90d", trigger_type: "manual" });
    await request(app.getHttpServer())
      .post("/api/v1/analysis-jobs")
      .send({ repo_url: "https://github.com/org/b", time_window: "30d", trigger_type: "manual" });

    const res = await request(app.getHttpServer()).get("/api/v1/analysis-jobs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0].job_id).toBeDefined();
    expect(res.body[0].status).toBeDefined();
  });

  it("GET /api/v1/analysis-jobs/:jobId returns a single job", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/analysis-jobs")
      .send({ repo_url: "https://github.com/org/test", time_window: "90d", trigger_type: "manual" });

    const res = await request(app.getHttpServer()).get(`/api/v1/analysis-jobs/${created.body.job_id}`);
    expect(res.status).toBe(200);
    expect(res.body.job_id).toBe(created.body.job_id);
    expect(res.body.status).toBe("PENDING");
  });

  it("GET /api/v1/analysis-jobs/:jobId returns 404 for unknown job", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/analysis-jobs/unknown");
    expect(res.status).toBe(404);
  });
});
