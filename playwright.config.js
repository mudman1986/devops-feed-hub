import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for UI testing
 * Tests UI on multiple device sizes (mobile, tablet, desktop)
 */
export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["list"],
        ["html"],
        ["github"],
        ["json", { outputFile: "test-results.json" }],
      ]
    : "html",
  timeout: 10000, // 10 seconds per test (static site, should be fast)
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 3000, // 3 seconds for individual actions (reduced from 5s for faster feedback)
    navigationTimeout: 3000, // 3 seconds for page navigation (reduced from 5s for faster feedback)
  },

  projects: [
    {
      name: "Desktop Chrome 1920x1080",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "Desktop Chrome 1366x768",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "Tablet iPad",
      use: {
        ...devices["Desktop Chrome"], // Use Chrome instead of WebKit
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Mobile iPhone SE",
      use: {
        ...devices["Desktop Chrome"], // Use Chrome instead of WebKit
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Mobile iPhone 12 Pro",
      use: {
        ...devices["Desktop Chrome"], // Use Chrome instead of WebKit
        viewport: { width: 414, height: 896 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: "npx http-server docs -p 8080 --silent",
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 10000, // 10 seconds to start server (reduced from 30s for faster feedback)
  },
});
