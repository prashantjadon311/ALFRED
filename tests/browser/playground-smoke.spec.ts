import { expect, test } from "@playwright/test";

test("playground sends a mock chat message without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon") && !message.text().includes("404 (Not Found)")) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/playground");
  await expect(page.getByPlaceholder("Ask A.L.F.R.E.D. anything...")).toBeVisible();
  await page.getByPlaceholder("Ask A.L.F.R.E.D. anything...").fill("Draft a compact agent workflow smoke test.");
  await page.getByRole("button", { name: /^send$/i }).click();

  await expect(page.getByText("Draft a compact agent workflow smoke test.")).toBeVisible();
  await expect(page.getByText(/Mock response generated locally|Mock A\.L\.F\.R\.E\.D\. agent response/)).toBeVisible({ timeout: 3000 });
  expect(consoleErrors).toEqual([]);
});
