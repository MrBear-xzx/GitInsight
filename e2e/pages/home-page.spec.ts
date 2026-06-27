import { test, expect } from "@playwright/test";

const WEB_URL = "http://127.0.0.1:3001";

test.describe("GitInsight Web - Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL);
  });

  test("should display the page title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("GitInsight");
  });

  test("should show repo URL input field", async ({ page }) => {
    await expect(page.locator("#repoUrl")).toBeVisible();
  });

  test("should show PAT input field", async ({ page }) => {
    await expect(page.locator("#pat")).toBeVisible();
  });

  test("should show time window selector", async ({ page }) => {
    await expect(page.locator("#timeWindow")).toBeVisible();
  });

  test("should have submit button", async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText("开始分析");
  });

  test("submit button should be enabled initially", async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).not.toBeDisabled();
  });

  test("should navigate to history page via nav link", async ({ page }) => {
    await page.getByRole("link", { name: "记录" }).click();
    await expect(page).toHaveURL(/\/history/);
  });

  test("should navigate to home via brand link", async ({ page }) => {
    await page.getByRole("link", { name: "GitInsight" }).first().click();
    await expect(page).toHaveURL(WEB_URL + "/");
  });
});
