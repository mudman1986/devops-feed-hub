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
  reporter: "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
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
    command: "npx http-server docs -p 8080",
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
