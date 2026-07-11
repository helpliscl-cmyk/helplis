import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3107",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run db:reset && npx next dev -p 3107",
    url: "http://localhost:3107",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
