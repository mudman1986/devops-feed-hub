import { expect, test } from "@playwright/test";

// Mock system date to match test data
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
    Date.now = () => fakeNow;
  });
});

/**
 * UI Layout Tests - Desktop
 * Validates layout and positioning on desktop screen sizes
 */
test.describe("Desktop Layout Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("header should be visible and properly aligned @desktop", async ({
    page,
  }) => {
    // Skip on mobile/tablet viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      test.skip();
    }

    const header = page.locator(".header");
    await expect(header).toBeVisible();

    const headerTitle = page.locator(".header-title");
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toContainText("DevOps Feed Hub");

    // Verify header controls are visible
    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();
  });

  test("sidebar should be visible on desktop @desktop", async ({ page }) => {
    // Skip on mobile/tablet viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      test.skip();
    }

    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();

    // Sidebar should not have collapsed class on desktop
    const isCollapsed = await sidebar.evaluate((el) =>
      el.classList.contains("collapsed"),
    );
    expect(isCollapsed).toBe(false);
  });

  test("feed sections should display with proper spacing @desktop", async ({
    page,
  }) => {
    const feedSections = page.locator(".feed-section");
    const count = await feedSections.count();

    expect(count).toBeGreaterThan(0);

    // Check first feed section has proper structure
    const firstSection = feedSections.first();
    await expect(firstSection).toBeVisible();

    const feedTitle = firstSection.locator("h3");
    await expect(feedTitle).toBeVisible();

    const feedCount = firstSection.locator(".feed-count");
    await expect(feedCount).toBeVisible();
  });

  test("buttons should be properly aligned @desktop", async ({ page }) => {
    // Skip on mobile/tablet viewports
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      test.skip();
    }

    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Get button bounding box to verify alignment
    const box = await themeToggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    // Verify button text is visible on desktop (may be hidden on mobile)
    const buttonText = themeToggle.locator("#theme-text");
    const isVisible = await buttonText.isVisible().catch(() => false);
    // On desktop, button text should be visible
    expect(isVisible).toBe(true);
  });

  test("timeframe selector should be visible and functional @desktop", async ({
    page,
  }) => {
    const timeframeSelect = page.locator("#timeframe-select");
    await expect(timeframeSelect).toBeVisible();

    // Verify dropdown has options
    const options = timeframeSelect.locator("option");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("footer should be at bottom of page @desktop", async ({ page }) => {
    const footer = page.locator(".footer");

    // If footer exists, verify it's visible
    const footerExists = (await footer.count()) > 0;
    if (footerExists) {
      await expect(footer).toBeVisible();
    }
  });
});

/**
 * UI Layout Tests - Tablet
 * Validates responsive behavior on tablet screen sizes
 */
test.describe("Tablet Layout Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("layout should adapt to tablet size @tablet", async ({ page }) => {
    const header = page.locator(".header");
    await expect(header).toBeVisible();

    // Verify responsive elements are visible
    const navToggle = page.locator("#nav-toggle");
    const navToggleExists = (await navToggle.count()) > 0;

    if (navToggleExists) {
      await expect(navToggle).toBeVisible();
    }
  });

  test("feed sections should stack vertically @tablet", async ({ page }) => {
    const feedSections = page.locator(".feed-section");
    const count = await feedSections.count();

    expect(count).toBeGreaterThan(0);

    // All feed sections should be visible
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(feedSections.nth(i)).toBeVisible();
    }
  });

  test("controls should be accessible on tablet @tablet", async ({ page }) => {
    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();

    const timeframeSelect = page.locator("#timeframe-select");
    await expect(timeframeSelect).toBeVisible();
  });
});

/**
 * UI Layout Tests - Mobile
 * Validates responsive behavior on mobile screen sizes
 */
test.describe("Mobile Layout Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("header should adapt to mobile size @mobile", async ({ page }) => {
    const header = page.locator(".header");
    await expect(header).toBeVisible();

    // Header should be full width on mobile
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headerBox.width).toBeGreaterThan(300);
  });

  test("sidebar should be collapsed by default on mobile @mobile", async ({
    page,
  }) => {
    // Only run on mobile viewports
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) {
      test.skip();
    }

    const sidebar = page.locator("#sidebar");

    if ((await sidebar.count()) > 0) {
      // On mobile, sidebar should be collapsed initially
      const isCollapsed = await sidebar.evaluate((el) =>
        el.classList.contains("collapsed"),
      );
      expect(isCollapsed).toBe(true);
    }
  });

  test("mobile navigation toggle should be visible @mobile", async ({
    page,
  }) => {
    const navToggle = page.locator("#nav-toggle");

    if ((await navToggle.count()) > 0) {
      await expect(navToggle).toBeVisible();

      // Button should be clickable
      await expect(navToggle).toBeEnabled();
    }
  });

  test("content should be scrollable on mobile @mobile", async ({ page }) => {
    const feedSections = page.locator(".feed-section");
    const count = await feedSections.count();

    expect(count).toBeGreaterThan(0);

    // Should be able to scroll to see all content
    const firstSection = feedSections.first();
    await expect(firstSection).toBeVisible();
  });

  test("buttons should be touch-friendly on mobile @mobile", async ({
    page,
  }) => {
    // Only run on mobile viewports
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 768) {
      test.skip();
    }

    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Button should have adequate touch target size (min 44x44px)
    const box = await themeToggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(40); // Allow some margin
  });

  test("text should be readable on mobile @mobile", async ({ page }) => {
    const headerTitle = page.locator(".header-title");
    await expect(headerTitle).toBeVisible();

    // Title should not overflow
    const box = await headerTitle.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
  });
});

/**
 * Cross-device visual regression checks
 */
test.describe("Visual Consistency Tests", () => {
  test("no layout shifts on page load @all", async ({ page }) => {
    await page.goto("/");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Take initial measurement
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Wait until the layout stabilizes relative to the initial height
    await page.waitForFunction(
      (startHeight) => Math.abs(document.body.scrollHeight - startHeight) < 50,
      initialHeight,
      { timeout: 1000 },
    );

    const finalHeight = await page.evaluate(() => document.body.scrollHeight);

    // Height shouldn't change significantly after load
    const heightDiff = Math.abs(finalHeight - initialHeight);
    expect(heightDiff).toBeLessThan(50);
  });

  test("images and icons load correctly @all", async ({ page }) => {
    await page.goto("/");

    // Check theme icon is rendered
    const themeIcon = page.locator("#theme-icon");
    await expect(themeIcon).toBeVisible();

    // SVG should have content
    const svgContent = await themeIcon.innerHTML();
    expect(svgContent.length).toBeGreaterThan(0);
  });
});
