import { test, expect } from "@playwright/test";

const WEB_URL = "http://127.0.0.1:3001";

test.describe("GitInsight Web - Dashboard Page", () => {
  test("should show error when repo_id is missing", async ({ page }) => {
    await page.goto(WEB_URL + "/dashboard");
    await expect(page.getByText("缺少仓库参数")).toBeVisible({ timeout: 10000 });
  });

  test("should render fallback metrics for a test repo", async ({ page }) => {
    await page.goto(WEB_URL + "/dashboard?repo_id=https://github.com/test/repo&window=90d");
    // Wait for metric cards to render — the API returns metrics with display_name
    // containing Chinese text like "交付吞吐" and "活跃贡献者数"
    await expect(page.locator("text=交付吞吐").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=活跃贡献者").first()).toBeVisible({ timeout: 5000 });
  });
});
