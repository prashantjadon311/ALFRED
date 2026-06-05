import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser-api",
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3101",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? "/usr/bin/google-chrome"
    }
  },
  webServer: [
    {
      command: "npm run dev:infra && npm run dev:backend",
      url: "http://localhost:4000/health/live",
      timeout: 120000,
      reuseExistingServer: true,
      env: {
        FRONTEND_URL: "http://localhost:3101"
      }
    },
    {
      command: "npm run dev -- -p 3101",
      url: "http://localhost:3101/login",
      timeout: 120000,
      reuseExistingServer: true,
      env: {
        NEXT_PUBLIC_API_MODE: "api",
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000"
      }
    }
  ]
});
