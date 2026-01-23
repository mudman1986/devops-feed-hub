/**
 * Navigation View Selector Tests
 * Tests that experimental view modes are available and working from the navigation dropdown
 */

const { test, expect } = require("@playwright/test");

test.describe("Navigation View Selector with Experimental Modes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("should have all view modes in navigation dropdown", async ({
    page,
  }) => {
    const viewSelect = page.locator("#view-select");
    await expect(viewSelect).toBeVisible();

    // Get all options and normalize whitespace
    const options = await viewSelect.locator("option").allTextContents();
    const normalizedOptions = options.map((opt) => opt.trim());

    // Should have 2 standard + 7 experimental = 9 total
    expect(normalizedOptions.length).toBe(9);
    expect(normalizedOptions).toContain("List");
    expect(normalizedOptions).toContain("Card");
    expect(normalizedOptions).toContain("Beta - Horizontal Scroll");
    expect(normalizedOptions).toContain("Beta - Masonry Grid");
    expect(normalizedOptions).toContain("Beta - Floating Panels");
    expect(normalizedOptions).toContain("Beta - Center Stage");
    expect(normalizedOptions).toContain("Beta - Top Strip");
    expect(normalizedOptions).toContain("Beta - List Dense");
    expect(normalizedOptions).toContain("Beta - Timeline Vertical");
  });

  test("should apply experimental view mode from navigation dropdown", async ({
    page,
  }) => {
    const viewSelect = page.locator("#view-select");

    // Select center-stage from navigation
    await viewSelect.selectOption("center-stage");
    await page.waitForTimeout(500);

    // Verify data-view attribute is set
    const dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("center-stage");

    // Verify it's stored in experimentalViewMode
    const storedViewMode = await page.evaluate(() =>
      localStorage.getItem("experimentalViewMode"),
    );
    expect(storedViewMode).toBe("center-stage");

    // Standard view should be cleared
    const standardView = await page.evaluate(() =>
      localStorage.getItem("view"),
    );
    expect(standardView).toBeNull();
  });

  test("should persist experimental view mode across page reloads", async ({
    page,
  }) => {
    // Select masonry-grid from navigation
    await page.locator("#view-select").selectOption("masonry-grid");
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Verify view mode is still applied
    const dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("masonry-grid");

    // Verify dropdown shows correct selection
    const selectedValue = await page.locator("#view-select").inputValue();
    expect(selectedValue).toBe("masonry-grid");
  });

  test("should switch between standard and experimental view modes", async ({
    page,
  }) => {
    const viewSelect = page.locator("#view-select");

    // Start with list (standard)
    await viewSelect.selectOption("list");
    await page.waitForTimeout(300);

    let dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("list");

    // Switch to experimental
    await viewSelect.selectOption("floating-panels");
    await page.waitForTimeout(300);

    dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("floating-panels");

    // Switch back to standard
    await viewSelect.selectOption("card");
    await page.waitForTimeout(300);

    dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("card");

    // Experimental view mode should be cleared
    const experimentalViewMode = await page.evaluate(() =>
      localStorage.getItem("experimentalViewMode"),
    );
    expect(experimentalViewMode).toBeNull();
  });

  test("should maintain view mode when navigating to settings and back", async ({
    page,
  }) => {
    // Select timeline-vertical from navigation
    await page.locator("#view-select").selectOption("timeline-vertical");
    await page.waitForTimeout(300);

    // Navigate to settings
    await page.goto("/settings.html");
    await page.waitForTimeout(500);

    // Verify settings page shows correct view mode
    const settingsViewValue = await page.locator("#view-setting").inputValue();
    expect(settingsViewValue).toBe("timeline-vertical");

    // Navigate back to home
    await page.goto("/");
    await page.waitForTimeout(500);

    // Verify view mode is still timeline-vertical
    const dataView = await page.evaluate(() =>
      document.documentElement.getAttribute("data-view"),
    );
    expect(dataView).toBe("timeline-vertical");

    // Verify navigation dropdown shows correct selection
    const navViewValue = await page.locator("#view-select").inputValue();
    expect(navViewValue).toBe("timeline-vertical");
  });

  test("all experimental view modes should display articles", async ({
    page,
  }) => {
    const experimentalModes = [
      "horizontal-scroll",
      "masonry-grid",
      "floating-panels",
      "center-stage",
      "top-strip",
      "list-dense",
      "timeline-vertical",
    ];

    for (const mode of experimentalModes) {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // Select the view mode from navigation
      await page.locator("#view-select").selectOption(mode);
      await page.waitForTimeout(500);

      // Verify articles are visible
      const mainContent = page.locator("#main-content");
      await expect(mainContent).toBeVisible();

      const articles = page.locator(".article-item");
      const articleCount = await articles.count();
      expect(articleCount).toBeGreaterThan(
        0,
        `${mode} should display articles`,
      );
    }
  });
});
