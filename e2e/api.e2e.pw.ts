import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:3000";

test.describe("GitInsight API E2E", () => {
  test("POST /api/v1/analysis-jobs creates a job", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/analysis-jobs`, {
      data: {
        repo_url: "https://github.com/org/repo",
        time_window: "90d",
        trigger_type: "manual",
      },
    });
    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.job_id).toBeDefined();
    expect(body.status).toBe("PENDING");
  });

  test("GET /api/v1/analysis-jobs returns job list", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analysis-jobs`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/v1/analysis-jobs/:jobId returns job detail", async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/api/v1/analysis-jobs`, {
      data: {
        repo_url: "https://github.com/org/detail-test",
        time_window: "30d",
        trigger_type: "manual",
      },
    });
    const { job_id } = await createRes.json();

    const res = await request.get(`${API_BASE}/api/v1/analysis-jobs/${job_id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.job_id).toBe(job_id);
    expect(body.status).toBe("PENDING");
  });

  test("GET /api/v1/analysis-jobs/:unknown returns 404", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analysis-jobs/unknown-id`);
    expect(res.status()).toBe(404);
  });

  test("GET /api/v1/dashboard returns metrics", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/dashboard?repo_id=test&window=90d`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.metrics).toBeDefined();
    expect(Array.isArray(body.metrics)).toBe(true);
  });

  test("GET /health returns ok", async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    expect(res.status()).toBe(200);
  });
});
