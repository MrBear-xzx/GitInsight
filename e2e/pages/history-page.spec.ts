import { test, expect } from "@playwright/test";

const WEB_URL = "http://127.0.0.1:3001";

test.describe("GitInsight Web - History Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + "/history");
  });

  test("should display history page title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("分析记录", { timeout: 15000 });
  });

  test("should render history table", async ({ page }) => {
    // Table should always render regardless of data
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
    // Table headers should exist
    await expect(page.getByRole("columnheader", { name: "仓库" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "状态" })).toBeVisible();
  });

  test("should have a link back to home", async ({ page }) => {
    const brandLink = page.getByRole("link", { name: "GitInsight" }).first();
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute("href", "/");
  });
});
