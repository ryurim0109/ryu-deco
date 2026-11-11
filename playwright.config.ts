import { defineConfig, devices } from "@playwright/test";
const staticPreview = process.env.PLAYWRIGHT_STATIC === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const origin = `http://127.0.0.1:${staticPreview ? 4173 : 3000}`;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    channel: process.env.CI ? undefined : "chrome",
    baseURL: origin,
    trace: "retain-on-failure",
  },
  webServer: {
    command: staticPreview ? "npm start" : "npm run dev",
    url: `${origin}${basePath}/`,
    reuseExistingServer: !staticPreview && !process.env.CI,
    timeout: 60_000,
  },
});
