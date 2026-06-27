import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const COMPOSE_FILE = "docker-compose.yml";
const COMPOSE_PROJECT = "gitinsight-e2e";
const API_URL = "http://127.0.0.1:3000";
const WEB_URL = "http://127.0.0.1:3001";

function dc(...args: string[]): string {
  return execSync("docker compose -f " + COMPOSE_FILE + " -p " + COMPOSE_PROJECT + " " + args.join(" "),
    { encoding: "utf-8", timeout: 180000 });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(label: string, url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    var status = 0;
    try {
      var out = execSync("curl -s -o /dev/null -w '%{http_code}' " + url,
        { encoding: 'utf-8', timeout: 5000 });
      status = Number(out.trim());
    } catch { /* ignore */ }
    if (status === 200) {
      console.log("  [OK] " + label + " ready after " + (i + 1) + "s");
      return;
    }
    await sleep(2000);
  }
  throw new Error("Timeout waiting for " + label + " at " + url);
}

function httpGet(url: string): { status: number; body: string } {
  try {
    var out = execSync("curl -s -o /dev/null -w '%{http_code}' " + url,
      { encoding: 'utf-8', timeout: 10000 });
    var status = Number(out.trim());
    var body = execSync("curl -s " + url, { encoding: "utf-8", timeout: 5000 });
    return { status, body };
  } catch {
    return { status: 0, body: "" };
  }
}

function httpPost(url: string, data: Record<string, unknown>): { status: number; body: string } {
  try {
    var dataStr = JSON.stringify(data);
    var out = execSync("curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '" + dataStr + "' " + url,
      { encoding: "utf-8", timeout: 30000 });
    var status = Number(out.trim());
    var body = execSync("curl -s -X POST -H 'Content-Type: application/json' -d '" + dataStr + "' " + url,
      { encoding: "utf-8", timeout: 10000 });
    return { status, body };
  } catch {
    return { status: 0, body: "" };
  }
}

describe("Docker Compose E2E", () => {
  beforeAll(() => {
    if (!existsSync(COMPOSE_FILE)) {
      throw new Error(COMPOSE_FILE + " not found");
    }
    try { dc("down", "-v", "--remove-orphans"); } catch { /* ignore */ }
  });

  it("should build and start all services", () => {
    var out = dc("up", "-d", "--build");
    expect(out).toBeDefined();
    console.log("  Docker compose build/start completed");
  });

  it("should have API health endpoint ready", async () => {
    await waitFor("API", API_URL + "/health");
    var r = httpGet(API_URL + "/health");
    expect(r.status).toBe(200);
    expect(r.body).toContain("ok");
  });

  it("should create an analysis job via API", () => {
    var payload = { repo_url: "https://github.com/test/repo", time_window: "90d", trigger_type: "manual" };
    var r = httpPost(API_URL + "/api/v1/analysis-jobs", payload);
    expect(r.status).toBe(202);
    var parsed = JSON.parse(r.body);
    expect(parsed.job_id).toBeDefined();
    expect(["PENDING", "SUCCEEDED", "FAILED_RETRYABLE"]).toContain(parsed.status);
  });

  it("should list analysis jobs", () => {
    var r = httpGet(API_URL + "/api/v1/analysis-jobs");
    expect(r.status).toBe(200);
    var jobs = JSON.parse(r.body);
    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThanOrEqual(1);
  });

  it("should return dashboard metrics", () => {
    var r = httpGet(API_URL + "/api/v1/dashboard?repo_id=test&window=90d");
    expect(r.status).toBe(200);
    var parsed = JSON.parse(r.body);
    expect(parsed.metrics).toBeDefined();
  });

  it("should have web frontend accessible", async () => {
    await waitFor("Web", WEB_URL, 20);
    var r = httpGet(WEB_URL);
    expect(r.status).toBe(200);
  });

  afterAll(() => {
    try { dc("down", "-v", "--remove-orphans"); } catch { /* ignore */ }
  });
});
