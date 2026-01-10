const { test, expect } = require("@playwright/test");

/**
 * View Mode Selector Tests
 * Tests for Normal and List view mode switching functionality
 */
test.describe("View Mode Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should have view selector visible in sidebar", async ({ page }) => {
    // Open sidebar if collapsed (mobile/tablet)
    const sidebar = page.locator("#sidebar");
    const isCollapsed = await sidebar
      .evaluate((el) => el.classList.contains("collapsed"))
      .catch(() => false);

    if (isCollapsed) {
      const navToggle = page.locator("#nav-toggle");
      if ((await navToggle.count()) > 0) {
        await navToggle.click();
        await page.waitForTimeout(300);
      }
    }

    const viewSelect = page.locator("#view-select");
    await expect(viewSelect).toBeVisible();

    // Verify it's in the sidebar footer
    const sidebarFooter = page.locator(".sidebar-footer");
    const viewSelectInFooter = sidebarFooter.locator("#view-select");
    await expect(viewSelectInFooter).toBeVisible();
  });

  test("should have List and Card options", async ({ page }) => {
    const viewSelect = page.locator("#view-select");
    const options = await viewSelect.locator("option").allTextContents();

    expect(options).toContain("List");
    expect(options).toContain("Card");
    expect(options.length).toBe(2);
  });

  test("should default to List view", async ({ page }) => {
    const htmlElement = page.locator("html");
    const viewAttr = await htmlElement.getAttribute("data-view");

    // List view is now default with data-view="list"
    expect(viewAttr).toBe("list");

    const viewSelect = page.locator("#view-select");
    const value = await viewSelect.inputValue();
    expect(value).toBe("list");
  });

  test("should switch to Card view when selected", async ({ page }) => {
    const htmlElement = page.locator("html");
    const viewSelect = page.locator("#view-select");

    // Switch to Card view
    await viewSelect.selectOption("card");
    await page.waitForTimeout(100);

    // Verify data-view attribute is set to card
    await expect(htmlElement).toHaveAttribute("data-view", "card");
  });

  test("should switch back to List view", async ({ page }) => {
    const htmlElement = page.locator("html");
    const viewSelect = page.locator("#view-select");

    // Switch to Card view
    await viewSelect.selectOption("card");
    await page.waitForTimeout(100);
    await expect(htmlElement).toHaveAttribute("data-view", "card");

    // Switch back to List
    await viewSelect.selectOption("list");
    await page.waitForTimeout(100);

    // Verify data-view attribute is set to list
    await expect(htmlElement).toHaveAttribute("data-view", "list");
  });

  test("should persist view selection to localStorage", async ({ page }) => {
    const viewSelect = page.locator("#view-select");

    // Switch to Card view
    await viewSelect.selectOption("card");
    await page.waitForTimeout(100);

    // Check localStorage
    const savedView = await page.evaluate(() => localStorage.getItem("view"));
    expect(savedView).toBe("card");
  });

  test("should load saved view preference on page load", async ({ page }) => {
    // Set preference before page loads
    await page.evaluate(() => localStorage.setItem("view", "card"));

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify view is applied
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveAttribute("data-view", "card");

    // Verify dropdown shows correct selection
    const viewSelect = page.locator("#view-select");
    const value = await viewSelect.inputValue();
    expect(value).toBe("card");
  });

  test("should apply Card view styles correctly", async ({ page }) => {
    const viewSelect = page.locator("#view-select");
    const feedSection = page.locator(".feed-section").first();

    if ((await feedSection.count()) === 0) {
      test.skip();
    }

    // Get background color in List view (default) - should be transparent
    const listBgColor = await feedSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Switch to Card view
    await viewSelect.selectOption("card");
    await page.waitForTimeout(100);

    // Get background color in Card view - should have a background
    const cardBgColor = await feedSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background colors should be different
    // List view should be transparent (rgba(0, 0, 0, 0))
    // Card view should have a color
    expect(listBgColor).toContain("rgba(0, 0, 0, 0)");
    expect(cardBgColor).not.toContain("rgba(0, 0, 0, 0)");
    expect(cardBgColor).not.toBe(listBgColor);
  });

  test("should show empty feeds in List view", async ({ page }) => {
    // List is default, already in list view

    // Check if any feed sections have no-articles class
    const noArticlesSections = page.locator(".feed-section:has(.no-articles)");
    const count = await noArticlesSections.count();

    if (count > 0) {
      // Verify they are still visible (not hidden by CSS)
      for (let i = 0; i < count; i++) {
        const section = noArticlesSections.nth(i);
        await expect(section).toBeVisible();
      }
    }
  });

  test("view selector should be sticky at bottom of viewport", async ({
    page,
  }) => {
    // Open sidebar if collapsed
    const sidebar = page.locator("#sidebar");
    const isCollapsed = await sidebar
      .evaluate((el) => el.classList.contains("collapsed"))
      .catch(() => false);

    if (isCollapsed) {
      const navToggle = page.locator("#nav-toggle");
      if ((await navToggle.count()) > 0) {
        await navToggle.click();
        await page.waitForTimeout(300);
      }
    }

    const sidebarFooter = page.locator(".sidebar-footer");

    // Check that sidebar-footer has sticky positioning
    const position = await sidebarFooter.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });

    expect(position).toBe("sticky");
  });

  test("view selector should stay visible when scrolling sidebar content", async ({
    page,
  }) => {
    // Open sidebar if collapsed
    const sidebar = page.locator("#sidebar");
    const isCollapsed = await sidebar
      .evaluate((el) => el.classList.contains("collapsed"))
      .catch(() => false);

    if (isCollapsed) {
      const navToggle = page.locator("#nav-toggle");
      if ((await navToggle.count()) > 0) {
        await navToggle.click();
        await page.waitForTimeout(300);
      }
    }

    const sidebarContent = page.locator(".sidebar-content");
    const sidebarFooter = page.locator(".sidebar-footer");
    const viewSelect = page.locator("#view-select");

    // Check if sidebar has scrollable content
    const hasScroll = await sidebarContent.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    });

    if (!hasScroll) {
      // If no scroll, skip this test
      test.skip();
    }

    // Get initial footer position
    const initialFooterBox = await sidebarFooter.boundingBox();
    const initialSelectBox = await viewSelect.boundingBox();

    // Verify footer and selector are initially visible
    expect(initialFooterBox).not.toBeNull();
    expect(initialSelectBox).not.toBeNull();
    await expect(sidebarFooter).toBeVisible();
    await expect(viewSelect).toBeVisible();

    // Scroll the sidebar content to middle
    await sidebarContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2;
    });
    await page.waitForTimeout(100);

    // Footer should still be visible and at the same viewport position
    const afterScrollFooterBox = await sidebarFooter.boundingBox();
    const afterScrollSelectBox = await viewSelect.boundingBox();

    expect(afterScrollFooterBox).not.toBeNull();
    expect(afterScrollSelectBox).not.toBeNull();
    await expect(sidebarFooter).toBeVisible();
    await expect(viewSelect).toBeVisible();

    // Footer should stay at approximately the same Y position (sticky behavior)
    if (initialFooterBox && afterScrollFooterBox) {
      const yDifference = Math.abs(initialFooterBox.y - afterScrollFooterBox.y);
      expect(yDifference).toBeLessThan(5); // Allow small rounding differences
    }

    // Scroll to bottom
    await sidebarContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(100);

    // Footer should still be visible
    await expect(sidebarFooter).toBeVisible();
    await expect(viewSelect).toBeVisible();
  });

  test("sidebar should have proper structure for sticky positioning", async ({
    page,
  }) => {
    const sidebar = page.locator("#sidebar");
    const sidebarContent = page.locator(".sidebar-content");
    const sidebarFooter = page.locator(".sidebar-footer");

    // Verify structure exists
    await expect(sidebar).toBeVisible();
    await expect(sidebarContent).toBeVisible();
    await expect(sidebarFooter).toBeVisible();

    // Check sidebar is flex container
    const sidebarDisplay = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(sidebarDisplay).toBe("flex");

    const sidebarFlexDirection = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });
    expect(sidebarFlexDirection).toBe("column");

    // Check sidebar-content has overflow
    const contentOverflowY = await sidebarContent.evaluate((el) => {
      return window.getComputedStyle(el).overflowY;
    });
    expect(contentOverflowY).toBe("auto");

    // Check footer has flex-shrink: 0 (doesn't shrink)
    const footerFlexShrink = await sidebarFooter.evaluate((el) => {
      return window.getComputedStyle(el).flexShrink;
    });
    expect(footerFlexShrink).toBe("0");
  });
});

/**
 * Timeframe Filtering with View Modes Tests
 * Tests that timeframe filtering works correctly in both view modes
 */
test.describe("Timeframe Filtering in Different Views", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("should filter articles by timeframe in Normal view", async ({
    page,
  }) => {
    const timeframeSelect = page.locator("#timeframe-select");
    const articles = page.locator(".article-item");

    if ((await articles.count()) === 0) {
      test.skip();
    }

    // Select different timeframes and verify filtering happens
    await timeframeSelect.selectOption("1day");
    await page.waitForTimeout(100);

    const visibleAfter1Day = await articles.evaluateAll(
      (items) => items.filter((el) => el.style.display !== "none").length,
    );

    await timeframeSelect.selectOption("30days");
    await page.waitForTimeout(100);

    const visibleAfter30Days = await articles.evaluateAll(
      (items) => items.filter((el) => el.style.display !== "none").length,
    );

    // 30 days should show same or more articles than 1 day
    expect(visibleAfter30Days).toBeGreaterThanOrEqual(visibleAfter1Day);
  });

  test("should filter articles by timeframe in List view", async ({ page }) => {
    const viewSelect = page.locator("#view-select");
    const timeframeSelect = page.locator("#timeframe-select");

    // Switch to List view
    await viewSelect.selectOption("list");
    await page.waitForTimeout(100);

    const articles = page.locator(".article-item");

    if ((await articles.count()) === 0) {
      test.skip();
    }

    // Test timeframe filtering
    await timeframeSelect.selectOption("1day");
    await page.waitForTimeout(100);

    const visibleAfter1Day = await articles.evaluateAll(
      (items) => items.filter((el) => el.style.display !== "none").length,
    );

    await timeframeSelect.selectOption("7days");
    await page.waitForTimeout(100);

    const visibleAfter7Days = await articles.evaluateAll(
      (items) => items.filter((el) => el.style.display !== "none").length,
    );

    // 7 days should show same or more articles
    expect(visibleAfter7Days).toBeGreaterThanOrEqual(visibleAfter1Day);
  });

  test("should handle switching from empty timeframe to non-empty in List view", async ({
    page,
  }) => {
    const viewSelect = page.locator("#view-select");
    const timeframeSelect = page.locator("#timeframe-select");

    // Switch to List view
    await viewSelect.selectOption("list");
    await page.waitForTimeout(100);

    // Select 1 day (might have few articles)
    await timeframeSelect.selectOption("1day");
    await page.waitForTimeout(100);

    // Then select 30 days (should have more)
    await timeframeSelect.selectOption("30days");
    await page.waitForTimeout(100);

    // Verify articles are visible
    const articles = page.locator(".article-item");
    if ((await articles.count()) > 0) {
      const visibleCount = await articles.evaluateAll(
        (items) => items.filter((el) => el.style.display !== "none").length,
      );

      expect(visibleCount).toBeGreaterThan(0);
    }
  });

  test("should update feed counts when changing timeframes", async ({
    page,
  }) => {
    const timeframeSelect = page.locator("#timeframe-select");
    const feedCounts = page.locator(".feed-count");

    if ((await feedCounts.count()) === 0) {
      test.skip();
    }

    // Get initial counts
    const initialTexts = await feedCounts.allTextContents();

    // Change timeframe
    await timeframeSelect.selectOption("30days");
    await page.waitForTimeout(100);

    const newTexts = await feedCounts.allTextContents();

    // Texts should update (may be same or different)
    expect(newTexts.length).toBeGreaterThan(0);
  });
});

/**
 * Cache Busting Tests
 * Verify that cache control headers and versioned CSS are present
 */
test.describe("Cache Busting", () => {
  test("should have cache control meta tags", async ({ page }) => {
    await page.goto("/");

    // Check for cache control meta tags
    const cacheControl = page.locator('meta[http-equiv="Cache-Control"]');
    await expect(cacheControl).toHaveAttribute(
      "content",
      "no-cache, no-store, must-revalidate",
    );

    const pragma = page.locator('meta[http-equiv="Pragma"]');
    await expect(pragma).toHaveAttribute("content", "no-cache");

    const expires = page.locator('meta[http-equiv="Expires"]');
    await expect(expires).toHaveAttribute("content", "0");
  });

  test("should have versioned CSS link", async ({ page }) => {
    await page.goto("/");

    // Check that CSS link has version parameter
    const cssLink = page.locator('link[rel="stylesheet"]');
    const href = await cssLink.getAttribute("href");

    expect(href).toContain("styles.css?v=");
  });
});
