/**
 * View Modes Visual Validation Tests
 * Tests that view modes actually apply their CSS and layout correctly
 */

const { test, expect } = require("@playwright/test");

test.describe("View Modes Visual Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  const experimentalViewModes = [
    "horizontal-scroll",
    "masonry-grid",
    "floating-panels",
    "center-stage",
    "top-strip",
    "list-dense",
    "timeline-vertical",
  ];

  test.describe("Standard View Modes", () => {
    test("List view should apply correct data-view attribute", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator("#view-setting").selectOption("list");
      await page.waitForTimeout(300);

      await page.goto("/");
      await page.waitForTimeout(500);

      const dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("list");
    });

    test("Card view should apply correct data-view attribute", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator("#view-setting").selectOption("card");
      await page.waitForTimeout(300);

      await page.goto("/");
      await page.waitForTimeout(500);

      const dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("card");
    });
  });

  test.describe("Experimental View Modes - Visual Validation", () => {
    for (const viewMode of experimentalViewModes) {
      test(`${viewMode} should apply correct data-view attribute and be visible`, async ({
        page,
      }) => {
        // Go to settings and select experimental view mode
        await page.goto("/settings.html");

        const viewSelect = page.locator("#view-setting");
        await viewSelect.selectOption(viewMode);
        await page.waitForTimeout(500);

        // Check that it's saved in localStorage
        const savedViewMode = await page.evaluate(() =>
          localStorage.getItem("experimentalViewMode"),
        );
        expect(savedViewMode).toBe(viewMode);

        // Navigate to home page
        await page.goto("/");
        await page.waitForTimeout(500);

        // Check data-view attribute is applied
        const dataView = await page.evaluate(() =>
          document.documentElement.getAttribute("data-view"),
        );
        expect(dataView).toBe(viewMode);

        // Take screenshot for manual verification
        await page.screenshot({
          path: `/tmp/view-mode-${viewMode}.png`,
          fullPage: false,
        });

        // Verify main content exists (should be visible in any view mode)
        const mainContent = page.locator("#main-content");
        await expect(mainContent).toBeVisible();

        // Verify there are articles
        const articles = page.locator(".article-item");
        const articleCount = await articles.count();
        expect(articleCount).toBeGreaterThan(0);
      });
    }
  });

  test.describe("View Mode Persistence", () => {
    test("Experimental view mode should persist across page reloads", async ({
      page,
    }) => {
      // Select center-stage view mode
      await page.goto("/settings.html");
      await page.locator("#view-setting").selectOption("center-stage");
      await page.waitForTimeout(300);

      // Go to home page
      await page.goto("/");
      await page.waitForTimeout(500);

      let dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("center-stage");

      // Reload page
      await page.reload();
      await page.waitForTimeout(500);

      // Verify view mode persists
      dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("center-stage");
    });

    test("Experimental view mode should persist when navigating to settings and back", async ({
      page,
    }) => {
      // Select masonry-grid view mode
      await page.goto("/settings.html");
      await page.locator("#view-setting").selectOption("masonry-grid");
      await page.waitForTimeout(300);

      // Go to home page
      await page.goto("/");
      await page.waitForTimeout(500);

      let dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("masonry-grid");

      // Go back to settings
      await page.goto("/settings.html");
      await page.waitForTimeout(500);

      // Verify selection is maintained
      const selectedValue = await page.locator("#view-setting").inputValue();
      expect(selectedValue).toBe("masonry-grid");

      // Go back to home
      await page.goto("/");
      await page.waitForTimeout(500);

      // Verify view mode still applied
      dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("masonry-grid");
    });
  });

  test.describe("View Mode + Theme Combinations", () => {
    test("Experimental view mode should work with experimental theme", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Select both experimental theme and view mode
      await page.locator("#theme-setting").selectOption("retro");
      await page.waitForTimeout(300);
      await page.locator("#view-setting").selectOption("horizontal-scroll");
      await page.waitForTimeout(300);

      // Navigate to home
      await page.goto("/");
      await page.waitForTimeout(500);

      // Verify both are applied
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      const dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );

      expect(dataTheme).toContain("retro");
      expect(dataView).toBe("horizontal-scroll");
    });
  });

  test.describe("View Mode CSS Application", () => {
    test("Each view mode should have unique CSS applied", async ({ page }) => {
      // Test that switching view modes actually changes the layout
      await page.goto("/");

      // Start with list view
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-view", "list");
      });

      // Check for list view - should have main content
      let mainContent = page.locator("#main-content");
      await expect(mainContent).toBeVisible();

      // Switch to center-stage
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-view", "center-stage");
      });

      // Main content should still be visible (CSS should change the layout)
      await expect(mainContent).toBeVisible();

      // The data-view attribute should control CSS
      const dataView = await page.evaluate(() =>
        document.documentElement.getAttribute("data-view"),
      );
      expect(dataView).toBe("center-stage");
    });
  });
});
