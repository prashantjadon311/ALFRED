import { expect, test } from "@playwright/test";

test("mock login, logout, and signup route render", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("demo@alfred.local");
  await page.locator('input[type="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /active agent loop/i })).toBeVisible();

  await page.getByLabel("Open user menu").click();
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole("link", { name: /create an account/i }).click();
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
});
