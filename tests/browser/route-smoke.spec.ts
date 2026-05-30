import { expect, test } from "@playwright/test";

const routes = [
  "/dashboard",
  "/playground",
  "/compare",
  "/projects",
  "/workflows",
  "/models",
  "/usage",
  "/library",
  "/settings",
  "/workspaces",
  "/profile",
  "/account",
  "/billing"
];

test.describe("main mock routes", () => {
  for (const route of routes) {
    test(`${route} renders without routing to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }
});
