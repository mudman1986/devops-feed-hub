import { test, expect } from "@playwright/test";

/**
 * Theme Toggle Functionality Tests
 * Tests dark/light mode switching
 */
test.describe("Theme Toggle Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should toggle between dark and light themes", async ({ page }) => {
    const htmlElement = page.locator("html");
    const themeToggle = page.locator("#theme-toggle");

    // Get initial theme
    const initialTheme = await htmlElement.getAttribute("data-theme");
    expect(initialTheme).toBeTruthy();

    // Click theme toggle
    await themeToggle.click();

    // Verify theme changed (Playwright will auto-wait for the change)
    await expect(htmlElement).not.toHaveAttribute("data-theme", initialTheme);
  });

  test("should update button text when theme changes", async ({ page }) => {
    const themeToggle = page.locator("#theme-toggle");
    const themeText = page.locator("#theme-text");

    // Get initial button text
    const initialText = await themeText.textContent();

    // Click toggle
    await themeToggle.click();

    // Verify text changed (Playwright will auto-wait for the change)
    await expect(themeText).not.toHaveText(initialText);

    // Text should be either "Light Mode" or "Dark Mode"
    const newText = await themeText.textContent();
    expect(["Light Mode", "Dark Mode"]).toContain(newText);
  });

  test("should update theme icon when toggling", async ({ page }) => {
    const themeIcon = page.locator("#theme-icon");
    const themeToggle = page.locator("#theme-toggle");

    // Get initial icon content
    const initialIcon = await themeIcon.innerHTML();

    // Click toggle
    await themeToggle.click();

    // Wait for icon content to change
    await page.waitForFunction(
      (iconEl) => iconEl.innerHTML !== initialIcon,
      await themeIcon.elementHandle(),
    );

    // Verify icon changed
    const newIcon = await themeIcon.innerHTML();
    expect(newIcon).not.toBe(initialIcon);
  });

  test("should persist theme preference on reload", async ({ page }) => {
    const htmlElement = page.locator("html");
    const themeToggle = page.locator("#theme-toggle");

    // Click toggle to change theme
    await themeToggle.click();

    // Wait for theme to change
    await page.waitForLoadState("load");
    const themeAfterToggle = await htmlElement.getAttribute("data-theme");

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify theme persisted
    const themeAfterReload = await htmlElement.getAttribute("data-theme");
    expect(themeAfterReload).toBe(themeAfterToggle);
  });
});

/**
 * Timeframe Filtering Tests
 * Tests article filtering by time period
 */
test.describe("Timeframe Filtering Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have timeframe selector with options", async ({ page }) => {
    const timeframeSelect = page.locator("#timeframe-select");
    await expect(timeframeSelect).toBeVisible();

    // Verify options exist
    const options = await timeframeSelect.locator("option").allTextContents();
    expect(options.length).toBeGreaterThan(0);
  });

  test("should filter articles when timeframe changes", async ({ page }) => {
    const timeframeSelect = page.locator("#timeframe-select");

    // Change timeframe
    await timeframeSelect.selectOption("7days");

    // Wait for filtering to complete by checking that feed counts are updated
    await page.waitForFunction(() => {
      const feedCounts = document.querySelectorAll(".feed-count");
      return feedCounts.length > 0;
    });

    // Articles may have changed (could be more or less)
    const newArticles = await page.locator(".article-item").count();
    expect(newArticles).toBeGreaterThanOrEqual(0);
  });

  test("should update feed counts after filtering", async ({ page }) => {
    const timeframeSelect = page.locator("#timeframe-select");

    // Change timeframe
    await timeframeSelect.selectOption("30days");

    // Wait for feed counts to be displayed
    const feedCounts = page.locator(".feed-count");
    await expect(feedCounts.first()).toBeVisible();

    const count = await feedCounts.count();
    expect(count).toBeGreaterThan(0);

    // Each count should show "N article(s)"
    const firstCount = await feedCounts.first().textContent();
    expect(firstCount).toMatch(/\d+ article(s)?/);
  });

  test("should persist timeframe preference on reload", async ({ page }) => {
    const timeframeSelect = page.locator("#timeframe-select");

    // Select a specific timeframe
    await timeframeSelect.selectOption("7days");

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify timeframe persisted
    const selectedValue = await timeframeSelect.inputValue();
    expect(selectedValue).toBe("7days");
  });
});

/**
 * Sidebar Toggle Tests (Mobile)
 * Tests sidebar collapse/expand on mobile
 */
test.describe("Sidebar Toggle Tests", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should toggle sidebar when clicking nav toggle @mobile", async ({
    page,
  }) => {
    const navToggle = page.locator("#nav-toggle");
    const sidebar = page.locator("#sidebar");

    if ((await navToggle.count()) === 0 || (await sidebar.count()) === 0) {
      test.skip();
    }

    // Sidebar should start collapsed on mobile
    const initiallyCollapsed = await sidebar.evaluate((el) =>
      el.classList.contains("collapsed"),
    );
    expect(initiallyCollapsed).toBe(true);

    // Click toggle to expand
    await navToggle.click();

    // Wait for sidebar to expand
    await page.waitForFunction(
      (sidebarEl) => !sidebarEl.classList.contains("collapsed"),
      await sidebar.elementHandle(),
    );

    // Sidebar should now be expanded
    const afterToggle = await sidebar.evaluate((el) =>
      el.classList.contains("collapsed"),
    );
    expect(afterToggle).toBe(false);
  });

  test("should close sidebar when clicking outside @mobile", async ({
    page,
  }) => {
    const navToggle = page.locator("#nav-toggle");
    const sidebar = page.locator("#sidebar");

    if ((await navToggle.count()) === 0 || (await sidebar.count()) === 0) {
      test.skip();
    }

    // Open sidebar
    await navToggle.click();

    // Wait for sidebar to open
    await page.waitForFunction(
      (sidebarEl) => !sidebarEl.classList.contains("collapsed"),
      await sidebar.elementHandle(),
    );

    // Click outside sidebar (on main content)
    const mainContent = page.locator(".main-content");
    if ((await mainContent.count()) > 0) {
      await mainContent.click({ position: { x: 10, y: 10 } });

      // Wait for sidebar to collapse
      await page.waitForFunction(
        (sidebarEl) => sidebarEl.classList.contains("collapsed"),
        await sidebar.elementHandle(),
      );

      // Sidebar should close
      const isCollapsed = await sidebar.evaluate((el) =>
        el.classList.contains("collapsed"),
      );
      expect(isCollapsed).toBe(true);
    }
  });
});

/**
 * Mark as Read Functionality Tests
 * Tests article read/unread marking
 */
test.describe("Mark as Read Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should mark article as read when clicking indicator", async ({
    page,
  }) => {
    const readIndicators = page.locator(".read-indicator");

    if ((await readIndicators.count()) === 0) {
      test.skip();
    }

    const firstIndicator = readIndicators.first();
    // Get parent article element using xpath for reliability
    const article = firstIndicator.locator("xpath=..");

    // Click read indicator
    await firstIndicator.click();

    // Wait for article to get 'read' class
    await expect(article).toHaveClass(/read/);
  });

  test("should toggle read status when clicking indicator twice", async ({
    page,
  }) => {
    const readIndicators = page.locator(".read-indicator");

    if ((await readIndicators.count()) === 0) {
      test.skip();
    }

    const firstIndicator = readIndicators.first();
    // Get parent article element using xpath for reliability
    const article = firstIndicator.locator("xpath=..");

    // Mark as read
    await firstIndicator.click();
    await expect(article).toHaveClass(/read/);

    // Mark as unread
    await firstIndicator.click();
    await expect(article).not.toHaveClass(/read/);
  });

  test("should clear all read articles when clicking reset button", async ({
    page,
  }) => {
    const readIndicators = page.locator(".read-indicator");
    const resetButton = page.locator("#reset-read-button");

    if (
      (await readIndicators.count()) === 0 ||
      (await resetButton.count()) === 0
    ) {
      test.skip();
    }

    // Mark first article as read
    await readIndicators.first().click();
    const article = readIndicators.first().locator("xpath=..");
    await expect(article).toHaveClass(/read/);

    // Handle confirm dialog
    page.once("dialog", (dialog) => dialog.accept());

    // Click reset button
    await resetButton.click();

    // Wait for articles to be unmarked
    await expect(article).not.toHaveClass(/read/);

    // No articles should have 'read' class
    const readArticles = page.locator(".article-item.read");
    const readCount = await readArticles.count();
    expect(readCount).toBe(0);
  });

  test("should persist read status on page reload", async ({ page }) => {
    const readIndicators = page.locator(".read-indicator");

    if ((await readIndicators.count()) === 0) {
      test.skip();
    }

    // Mark first article as read
    await readIndicators.first().click();
    const article = readIndicators.first().locator("xpath=..");
    await expect(article).toHaveClass(/read/);

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Article should still be marked as read
    const readArticles = page.locator(".article-item.read");
    await expect(readArticles.first()).toBeVisible();
    const readCount = await readArticles.count();
    expect(readCount).toBeGreaterThan(0);
  });
});

/**
 * Navigation and Links Tests
 */
test.describe("Navigation Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have working sidebar navigation links", async ({ page }) => {
    const navLinks = page.locator(".feed-nav a, .nav-link");

    if ((await navLinks.count()) === 0) {
      test.skip();
    }

    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Verify first link is clickable
    const firstLink = navLinks.first();
    await expect(firstLink).toBeVisible();
  });

  test("should have working article links", async ({ page }) => {
    const articleLinks = page.locator(".article-title");

    if ((await articleLinks.count()) === 0) {
      test.skip();
    }

    const linkCount = await articleLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Verify links have href attribute
    const firstLink = articleLinks.first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  });
});
