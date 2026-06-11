import { expect, test } from "@playwright/test";

test("restores an API session from the HttpOnly refresh cookie and revokes it on logout", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("demo@alfred.local");
  await page.locator('input[type="password"]').fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  let refreshRequests = 0;
  let successfulModelReads = 0;

  page.on("request", (request) => {
    if (
      request.url().endsWith("/auth/refresh") &&
      request.method() === "POST"
    ) {
      refreshRequests += 1;
    }
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (
      response.status() === 200 &&
      (url.pathname === "/models" ||
        url.pathname === "/model-providers")
    ) {
      successfulModelReads += 1;
    }
  });

  expect(await page.evaluate(() => localStorage.getItem("alfred_access_token"))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("alfred_refresh_token"))).toBeNull();

  await page.waitForTimeout(2500);
  await page.getByRole("link", { name: "Models" }).click();
  await expect(page).toHaveURL(/\/models/);
  await expect(
    page.getByText(/API key safety/i)
  ).toBeVisible();
  await expect.poll(() => refreshRequests).toBe(1);
  await expect.poll(() => successfulModelReads).toBe(2);

  refreshRequests = 0;
  await page.reload();
  await expect(page).toHaveURL(/\/models/);
  await expect(page.getByText(/API key safety/i)).toBeVisible();
  await expect.poll(() => refreshRequests).toBe(1);

  await page.goto("/usage");
  await expect(page.getByText("Total tokens used")).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/dashboard");
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});
