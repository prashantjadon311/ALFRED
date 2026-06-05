import { expect, test, type Page } from "@playwright/test";

function apiResponse(page: Page, path: string, method = "GET") {
  return page.waitForResponse((response) => {
    const url = response.url();
    return url.startsWith("http://localhost:4000") && url.includes(path) && response.request().method() === method && response.ok();
  });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("demo@alfred.local");
  await page.locator('input[type="password"]').fill("password123");
  await Promise.all([
    apiResponse(page, "/auth/login", "POST"),
    page.getByRole("button", { name: /sign in/i }).click()
  ]);
  await expect(page).toHaveURL(/\/dashboard/);
}

test("API mode smoke covers core authenticated routes", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const workspaceName = `API Smoke Workspace ${suffix}`;
  const projectName = `API Smoke Project ${suffix}`;
  const prompt = `API smoke playground message ${suffix}`;

  await login(page);

  await Promise.all([
    apiResponse(page, "/dashboard/summary"),
    page.goto("/dashboard")
  ]);
  await expect(page.getByText("Total Projects")).toBeVisible();
  await expect(page.getByText("Active Agent Loop")).toBeVisible();

  await Promise.all([
    apiResponse(page, "/workspaces"),
    page.goto("/workspaces")
  ]);
  await expect(page.getByText("Projects").first()).toBeVisible();
  await page.getByPlaceholder("Workspace name").fill(workspaceName);
  await page.getByPlaceholder("Description").fill("Created by API-mode smoke test.");
  await Promise.all([
    apiResponse(page, "/workspaces", "POST"),
    page.getByRole("button", { name: /^create$/i }).click()
  ]);
  await expect(page.getByRole("heading", { name: workspaceName })).toBeVisible();
  const newWorkspaceCard = page.locator(".glass-panel, [class*='rounded']").filter({ hasText: workspaceName }).last();
  const setActive = newWorkspaceCard.getByRole("button", { name: /set active/i });
  if (await setActive.count()) {
    await setActive.click();
    await page.waitForTimeout(250);
  }

  await page.goto("/projects");
  await expect(page.getByText(/projects shown/i)).toBeVisible();
  await page.getByRole("button", { name: /^create$/i }).click();
  await page.getByPlaceholder("Project name").fill(projectName);
  await page.getByPlaceholder("Original requirement").fill("Smoke test project created through the API-backed UI.");
  await Promise.all([
    apiResponse(page, "/projects", "POST"),
    page.getByRole("button", { name: /create mocked project/i }).click()
  ]);
  await expect(page.getByText(projectName)).toBeVisible();

  await Promise.all([
    apiResponse(page, "/chats"),
    page.goto("/playground")
  ]);
  if (await page.getByText("No chat sessions").count()) {
    await Promise.all([
      apiResponse(page, "/chats", "POST"),
      page.getByRole("button", { name: /new chat/i }).first().click()
    ]);
  }
  await page.getByPlaceholder("Ask A.L.F.R.E.D. anything...").fill(prompt);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/chats/") && response.url().endsWith("/messages") && response.request().method() === "POST" && response.ok()),
    page.getByRole("button", { name: /^send$/i }).click()
  ]);
  await expect(page.getByText(prompt)).toBeVisible();
  await expect(page.getByText(/Mock assistant response for A\.L\.F\.R\.E\.D\.|mock response/i)).toBeVisible();

  await Promise.all([
    apiResponse(page, "/model-providers"),
    apiResponse(page, "/models"),
    page.goto("/models")
  ]);
  await expect(page.getByText(/API key safety/i)).toBeVisible();
  const providerTest = page.getByRole("button", { name: /test mocked/i }).first();
  if (await providerTest.count()) {
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/model-providers/") && response.url().endsWith("/test") && response.request().method() === "POST" && response.ok()),
      providerTest.click()
    ]);
    await expect(page.getByText(/provider reachable \(mock\)|Mock provider ready/i).first()).toBeVisible();
  }

  await Promise.all([
    apiResponse(page, "/usage/daily"),
    page.goto("/usage")
  ]);
  await expect(page.getByText("Total tokens used")).toBeVisible();
  await expect(page.getByText("Daily Usage")).toBeVisible();

  await Promise.all([
    apiResponse(page, "/prompts"),
    page.goto("/library")
  ]);
  await expect(page.getByText("All")).toBeVisible();
  const favorite = page.locator('button[aria-label^="Favorite"], button[aria-label*="from favorites"]').first();
  if (await favorite.count()) {
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("/prompts/") && response.url().endsWith("/favorite") && response.request().method() === "POST" && response.ok()),
      favorite.click()
    ]);
    await expect(page.getByText(/favorite state saved/i)).toBeVisible();
  }

  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /save settings/i })).toBeVisible();
  await Promise.all([
    apiResponse(page, "/settings", "PATCH"),
    page.getByRole("button", { name: /save settings/i }).click()
  ]);
  await expect(page.getByText(/settings saved locally/i)).toBeVisible();
});
