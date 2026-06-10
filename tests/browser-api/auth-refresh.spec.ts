import { expect, test } from "@playwright/test";

test("restores an API session from the HttpOnly refresh cookie and revokes it on logout", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("demo@alfred.local");
  await page.locator('input[type="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  expect(await page.evaluate(() => localStorage.getItem("alfred_access_token"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("alfred_refresh_token"))).toBeNull();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Total Projects")).toBeVisible();

  await page.goto("/usage");
  await expect(page.getByText("Total tokens used")).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/dashboard");
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});
