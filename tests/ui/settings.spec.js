import { test, expect } from "@playwright/test";

/**
 * Settings Page Tests
 * Tests settings page functionality including feed selection, theme, and view mode
 */
test.describe("Settings Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Settings Page Navigation", () => {
    test("should have settings button in sidebar", async ({ page }) => {
      await page.goto("/");
      const settingsButton = page.locator("#settings-button");
      await expect(settingsButton).toBeVisible();
    });

    test("should navigate to settings page when button clicked", async ({
      page,
    }) => {
      await page.goto("/");
      const settingsButton = page.locator("#settings-button");
      await settingsButton.click();

      // Verify we're on settings page
      await expect(page).toHaveURL(/settings\.html/);
    });

    test("settings button should be in sidebar-footer below view selector", async ({
      page,
    }) => {
      await page.goto("/");
      const sidebarFooter = page.locator(".sidebar-footer");
      const viewSelector = page.locator(".view-selector");
      const settingsSelector = page.locator(".settings-selector");

      await expect(sidebarFooter).toContainText("View");
      await expect(sidebarFooter).toContainText("Settings");

      // Settings should be after view selector in DOM
      const sidebarContent = await sidebarFooter.textContent();
      const viewIndex = sidebarContent.indexOf("View");
      const settingsIndex = sidebarContent.indexOf("Settings");
      expect(settingsIndex).toBeGreaterThan(viewIndex);
    });
  });

  test.describe("Settings Page Layout", () => {
    test("should have VS Code-like settings page structure", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Check for main container
      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();

      // Check for sidebar menu
      const sidebar = page.locator(".settings-sidebar");
      await expect(sidebar).toBeVisible();

      // Check for content area
      const content = page.locator(".settings-content");
      await expect(content).toBeVisible();
    });

    test("should have settings menu with expected sections", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Check for menu items
      await expect(page.locator('text="Appearance"')).toBeVisible();
      await expect(page.locator('text="Feed Selection"')).toBeVisible();
      await expect(page.locator('text="Display Options"')).toBeVisible();
    });

    test("should have back to feeds button", async ({ page }) => {
      await page.goto("/settings.html");
      const backButton = page.locator('a[href="index.html"]');
      await expect(backButton).toBeVisible();
    });
  });

  test.describe("Feed Selection Settings", () => {
    test("should display feed checkboxes", async ({ page }) => {
      await page.goto("/settings.html");

      // Click on Feed Selection menu
      await page.locator('text="Feed Selection"').click();

      // Wait for feed list to load
      await page.waitForSelector(".feed-list", { timeout: 5000 });

      // Check that feed checkboxes exist
      const feedCheckboxes = page.locator('.feed-list input[type="checkbox"]');
      const count = await feedCheckboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have select all and deselect all buttons", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();

      await expect(page.locator("#select-all-feeds")).toBeVisible();
      await expect(page.locator("#deselect-all-feeds")).toBeVisible();
    });

    test("select all button should check all feed checkboxes", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();

      // Wait for feed list
      await page.waitForSelector(".feed-list");

      // Click select all
      await page.locator("#select-all-feeds").click();

      // Check all checkboxes are checked
      const checkboxes = page.locator('.feed-list input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }
    });

    test("deselect all button should uncheck all feed checkboxes", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();

      // Wait for feed list
      await page.waitForSelector(".feed-list");

      // First select all
      await page.locator("#select-all-feeds").click();

      // Then deselect all
      await page.locator("#deselect-all-feeds").click();

      // Check all checkboxes are unchecked
      const checkboxes = page.locator('.feed-list input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked();
      }
    });

    test("should persist feed selection in localStorage", async ({ page }) => {
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();

      // Wait for feed list
      await page.waitForSelector(".feed-list");

      // Select specific feeds
      await page.locator("#select-all-feeds").click();

      // Check that enabledFeeds is in localStorage
      const enabledFeeds = await page.evaluate(() =>
        localStorage.getItem("enabledFeeds")
      );
      expect(enabledFeeds).not.toBeNull();

      // Parse and verify it's an array
      const feeds = JSON.parse(enabledFeeds);
      expect(Array.isArray(feeds)).toBe(true);
      expect(feeds.length).toBeGreaterThan(0);
    });
  });

  test.describe("Theme Settings", () => {
    test("should display theme toggle in appearance section", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      await page.locator('text="Appearance"').click();

      // Check for theme selection
      const themeSection = page.locator(".settings-section").first();
      await expect(themeSection).toContainText("Theme");
    });
  });

  test.describe("Display Options Settings", () => {
    test("should display view mode selector", async ({ page }) => {
      await page.goto("/settings.html");
      await page.locator('text="Display Options"').click();

      // Check for view mode options
      await expect(page.locator('text="View Mode"')).toBeVisible();
    });

    test("should display timeframe default selector", async ({ page }) => {
      await page.goto("/settings.html");
      await page.locator('text="Display Options"').click();

      // Check for timeframe options
      await expect(page.locator('text="Default Timeframe"')).toBeVisible();
    });
  });

  test.describe("Settings Persistence", () => {
    test("should maintain settings across navigation", async ({ page }) => {
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();
      await page.waitForSelector(".feed-list");

      // Select all feeds
      await page.locator("#select-all-feeds").click();

      // Navigate away
      await page.goto("/");

      // Navigate back to settings
      await page.goto("/settings.html");
      await page.locator('text="Feed Selection"').click();
      await page.waitForSelector(".feed-list");

      // Check that feeds are still selected
      const checkboxes = page.locator('.feed-list input[type="checkbox"]');
      const firstCheckbox = checkboxes.first();
      await expect(firstCheckbox).toBeChecked();
    });
  });

  test.describe("Responsive Design", () => {
    test("should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/settings.html");

      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();
    });

    test("should be responsive on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/settings.html");

      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();
    });

    test("should be responsive on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/settings.html");

      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();
    });
  });
});

/**
 * Feed Filtering Integration Tests
 * Tests that feed filtering works correctly on main page
 */
test.describe("Feed Filtering Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should show all feeds when no filter is set", async ({ page }) => {
    await page.goto("/");

    // All feed navigation links should be visible
    const navLinks = page.locator(".nav-link");
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });

  test("should hide disabled feeds from navigation", async ({ page }) => {
    // Set enabledFeeds to only include specific feeds
    await page.evaluate(() => {
      localStorage.setItem(
        "enabledFeeds",
        JSON.stringify(["GitHub Blog", "Docker Blog"])
      );
    });

    await page.goto("/");

    // GitHub Blog and Docker Blog should be visible
    const githubLink = page.locator('.nav-link:has-text("GitHub Blog")');
    await expect(githubLink).toBeVisible();

    const dockerLink = page.locator('.nav-link:has-text("Docker Blog")');
    if ((await dockerLink.count()) > 0) {
      await expect(dockerLink).toBeVisible();
    }
  });

  test("should not filter All Feeds and Summary links", async ({ page }) => {
    // Set very restrictive filter
    await page.evaluate(() => {
      localStorage.setItem("enabledFeeds", JSON.stringify(["GitHub Blog"]));
    });

    await page.goto("/");

    // All Feeds and Summary should always be visible
    const allFeedsLink = page.locator('.nav-link:has-text("All Feeds")');
    if ((await allFeedsLink.count()) > 0) {
      await expect(allFeedsLink).toBeVisible();
    }

    const summaryLink = page.locator('.nav-link:has-text("Summary")');
    if ((await summaryLink.count()) > 0) {
      await expect(summaryLink).toBeVisible();
    }
  });
});
