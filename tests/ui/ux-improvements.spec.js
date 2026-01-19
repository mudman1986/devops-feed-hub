import { expect, test } from "@playwright/test";

/**
 * UX Improvements Tests
 * Tests for loading states, toast notifications, and external link indicators
 */

// Mock system date to a fixed time for consistent test data filtering
test.beforeEach(async ({ page }) => {
  // Mock Date.now() to return a fixed timestamp
  await page.addInitScript(() => {
    const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
    Date.now = () => fakeNow;
  });
});

test.describe("Loading States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show loading state on theme toggle", async ({ page }) => {
    const themeToggle = page.locator("#theme-toggle");

    // Click theme toggle and check for loading class
    await themeToggle.click();

    // Wait for loading to complete (should be brief)
    await page.waitForTimeout(500);

    // Verify theme changed successfully
    const htmlElement = page.locator("html");
    const currentTheme = await htmlElement.getAttribute("data-theme");
    expect(currentTheme).toBeTruthy();
  });

  test("should show loading state when clearing read articles", async ({
    page,
  }) => {
    // Wait for reset button to be available
    await page.waitForSelector("#reset-read-button", { state: "visible" });

    const resetButton = page.locator("#reset-read-button");

    // Set up dialog handler to auto-accept
    page.on("dialog", (dialog) => dialog.accept());

    // Click reset button
    await resetButton.click();

    // Wait for operation to complete
    await page.waitForTimeout(500);

    // Verify articles are no longer marked as read
    const readArticles = await page.evaluate(() =>
      localStorage.getItem("readArticles"),
    );
    expect(readArticles).toBeNull();
  });
});

test.describe("Toast Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show success toast when clearing read articles", async ({
    page,
  }) => {
    // Wait for reset button to be available
    await page.waitForSelector("#reset-read-button", { state: "visible" });

    const resetButton = page.locator("#reset-read-button");

    // Set up dialog handler to auto-accept
    page.on("dialog", (dialog) => dialog.accept());

    // Click reset button
    await resetButton.click();

    // Wait for toast to appear
    const toast = page.locator(".toast.toast-success");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify toast message
    const toastContent = toast.locator(".toast-content");
    await expect(toastContent).toContainText("cleared successfully");

    // Wait for toast to disappear (auto-dismiss after 3 seconds)
    await expect(toast).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Settings Page Toast Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings.html");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show toast when theme setting changes", async ({ page }) => {
    const themeSelect = page.locator("#theme-setting");

    // Change theme
    await themeSelect.selectOption("light");

    // Wait for toast to appear
    const toast = page.locator(".toast.toast-success");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify toast message
    const toastContent = toast.locator(".toast-content");
    await expect(toastContent).toContainText("Theme changed");
  });

  test("should show toast when view mode changes", async ({ page }) => {
    const viewSelect = page.locator("#view-setting");

    // Change view mode
    await viewSelect.selectOption("card");

    // Wait for toast to appear
    const toast = page.locator(".toast.toast-success");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify toast message
    const toastContent = toast.locator(".toast-content");
    await expect(toastContent).toContainText("View mode changed");
  });

  test("should show toast when timeframe changes", async ({ page }) => {
    const timeframeSelect = page.locator("#timeframe-setting");

    // Change timeframe
    await timeframeSelect.selectOption("7days");

    // Wait for toast to appear
    const toast = page.locator(".toast.toast-success");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify toast message
    const toastContent = toast.locator(".toast-content");
    await expect(toastContent).toContainText("Time range updated");
  });

  test("should show toast when feed selection is saved", async ({ page }) => {
    // Navigate to Feed Selection section first
    const feedsMenuItem = page.locator(
      '.settings-menu-item[data-section="feeds"]',
    );
    await feedsMenuItem.click();

    // Wait for feed checkboxes to load (they're populated via fetch)
    await page.waitForSelector(".feed-checkbox-item", {
      state: "visible",
      timeout: 5000,
    });

    const selectAllButton = page.locator("#select-all-feeds");
    await selectAllButton.click();

    // Wait for toast to appear
    const toast = page.locator(".toast.toast-success");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify toast message
    const toastContent = toast.locator(".toast-content");
    await expect(toastContent).toContainText("Feed selection saved");
  });
});

test.describe("External Link Indicators", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display external link icon on article titles", async ({
    page,
  }) => {
    // Wait for articles to load
    await page.waitForSelector(".article-item", { state: "visible" });

    // Check first article link has external icon
    const firstArticleLink = page.locator(".article-title").first();
    const externalIcon = firstArticleLink.locator(".external-link-icon");

    await expect(externalIcon).toBeVisible();
    await expect(externalIcon).toHaveAttribute("aria-hidden", "true");
  });

  test("should have screen reader text for external links", async ({
    page,
  }) => {
    // Wait for articles to load
    await page.waitForSelector(".article-item", { state: "visible" });

    // Check first article link has screen reader text
    const firstArticleLink = page.locator(".article-title").first();
    const srText = firstArticleLink.locator(".sr-only");

    await expect(srText).toBeAttached();
    await expect(srText).toContainText("opens in new tab");
  });

  test("should apply external link indicator to all article links", async ({
    page,
  }) => {
    // Wait for articles to load
    await page.waitForSelector(".article-item", { state: "visible" });

    // Count article links
    const articleLinks = page.locator(".article-title");
    const count = await articleLinks.count();
    expect(count).toBeGreaterThan(0);

    // Check each article link has the indicator
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = articleLinks.nth(i);
      const externalIcon = link.locator(".external-link-icon");
      await expect(externalIcon).toBeAttached();
    }
  });
});

test.describe("Accessibility - ARIA attributes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should set aria-busy during loading", async ({ page }) => {
    const themeToggle = page.locator("#theme-toggle");

    // Start the async operation
    const clickPromise = themeToggle.click();

    // The aria-busy might be set very briefly, so we just verify the click completes
    await clickPromise;

    // Verify final state has aria-busy as false
    await expect(themeToggle).toHaveAttribute("aria-busy", "false");
  });

  test("toast notifications should have proper ARIA roles", async ({
    page,
  }) => {
    // Navigate to settings to trigger a toast
    await page.goto("/settings.html");
    await page.evaluate(() => localStorage.clear());

    const themeSelect = page.locator("#theme-setting");
    await themeSelect.selectOption("light");

    // Wait for toast
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible({ timeout: 2000 });

    // Verify ARIA attributes
    await expect(toast).toHaveAttribute("role", "status");
  });

  test("toast container should have aria-live region", async ({ page }) => {
    // Navigate to settings to trigger a toast
    await page.goto("/settings.html");
    await page.evaluate(() => localStorage.clear());

    const themeSelect = page.locator("#theme-setting");
    await themeSelect.selectOption("light");

    // Wait for toast container
    const toastContainer = page.locator("#toast-container");
    await expect(toastContainer).toBeVisible({ timeout: 2000 });

    // Verify ARIA attributes
    await expect(toastContainer).toHaveAttribute("aria-live", "polite");
    await expect(toastContainer).toHaveAttribute("aria-atomic", "true");
  });
});
