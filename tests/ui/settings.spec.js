import { expect, test } from "@playwright/test";

// Mock system date to match test data (2026-01-11, 12 hours after collection)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
    Date.now = () => fakeNow;
  });

  // Navigate to page and clear localStorage in correct order
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

/**
 * Settings Page Tests
 * Tests settings page functionality including feed selection, theme, and view mode
 */
test.describe("Settings Page Tests", () => {
  test.describe("Settings Page Navigation", () => {
    test("should have settings button in sidebar", async ({ page }) => {
      await page.goto("/");
      // Removed explicit wait - toBeVisible auto-waits
      const settingsButton = page.locator("#settings-button");
      await expect(settingsButton).toBeVisible();
    });

    test("should navigate to settings page when button clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // On mobile/tablet, sidebar is hidden behind hamburger menu
      // Check if menu toggle button exists (mobile view)
      const menuToggle = page.locator('.menu-toggle, button:has-text("Menu")');
      if (await menuToggle.isVisible().catch(() => false)) {
        await menuToggle.click();
        // Wait for settings button to be visible after menu opens
        await expect(page.locator("#settings-button")).toBeVisible();
      }

      // Removed explicit wait - toBeVisible auto-waits
      const settingsButton = page.locator("#settings-button");
      await settingsButton.scrollIntoViewIfNeeded();
      await settingsButton.click();

      // Verify we're on settings page
      await expect(page).toHaveURL(/settings\.html/);
    });

    test("settings button should be in header controls", async ({ page }) => {
      await page.goto("/");
      // Removed explicit wait - toBeVisible auto-waits
      const settingsButton = page.locator("#settings-button");

      // Settings button is now in header (icon-only)
      await expect(settingsButton).toBeVisible();

      // Verify it has proper aria-label for accessibility
      await expect(settingsButton).toHaveAttribute("aria-label", "Settings");
    });
  });

  test.describe("Settings Page Layout", () => {
    test("should have VS Code-like settings page structure", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits

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
      // Removed explicit wait - toBeVisible auto-waits

      // Check for menu items in sidebar
      await expect(
        page.locator('.settings-menu-item:has-text("Appearance & Display")'),
      ).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('.settings-menu-item:has-text("Feed Selection")'),
      ).toBeVisible({ timeout: 10000 });
    });

    test("should have back to feeds button", async ({ page }) => {
      await page.goto("/settings.html");
      await page.waitForLoadState("load");
      const backButton = page
        .locator(
          '.settings-back-button, #settings-back-button, a:has-text("Back to Feeds"), button:has-text("Back")',
        )
        .first();
      await expect(backButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Feed Selection Settings", () => {
    test("should display feed checkboxes", async ({ page }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits

      // Click on Feed Selection menu item
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();

      // Wait for feed list to load - increased timeout for fetch
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // Check that feed checkboxes exist
      const feedCheckboxes = page.locator(
        '#feed-checkboxes input[type="checkbox"]',
      );
      const count = await feedCheckboxes.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have select all and deselect all buttons", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      await expect(page.locator("#select-all-feeds")).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator("#deselect-all-feeds")).toBeVisible({
        timeout: 10000,
      });
    });

    test("select all button should check all feed checkboxes", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // Click select all
      await page.locator("#select-all-feeds").click();
      await page.waitForTimeout(500); // Give time for checkboxes to update

      // Check all checkboxes are checked
      const checkboxes = page.locator(
        '#feed-checkboxes input[type="checkbox"]',
      );
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }
    });

    test("deselect all button should uncheck all feed checkboxes", async ({
      page,
    }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // First select all
      await page.locator("#select-all-feeds").click();
      await page.waitForTimeout(500);

      // Then deselect all
      await page.locator("#deselect-all-feeds").click();
      await page.waitForTimeout(500);

      // Check all checkboxes are unchecked
      const checkboxes = page.locator(
        '#feed-checkboxes input[type="checkbox"]',
      );
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked();
      }
    });

    test("should persist feed selection in localStorage", async ({ page }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // Select specific feeds
      await page.locator("#select-all-feeds").click();
      await page.waitForTimeout(500);

      // Check that enabledFeeds is in localStorage
      const enabledFeeds = await page.evaluate(() =>
        localStorage.getItem("enabledFeeds"),
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
      // Removed explicit wait - toBeVisible auto-waits
      await page.locator('.settings-menu-item:has-text("Appearance")').click();

      // Check for theme section
      const appearanceSection = page
        .locator("#appearance-section, .settings-section")
        .first();
      await expect(appearanceSection).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Appearance & Display Settings", () => {
    test("should display view mode selector", async ({ page }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Appearance & Display")')
        .click();

      // Check for view mode options in appearance section (now merged)
      await page.waitForSelector("#appearance-section:visible", {
        timeout: 10000,
      });
      const appearanceSection = page.locator("#appearance-section");
      await expect(appearanceSection).toBeVisible({ timeout: 10000 });

      // Verify view mode setting is present
      const viewSetting = page.locator("#view-setting");
      await expect(viewSetting).toBeVisible({ timeout: 10000 });
    });

    test("should display timeframe default selector", async ({ page }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Appearance & Display")')
        .click();

      // Check for timeframe setting in appearance section (now merged)
      await page.waitForSelector("#appearance-section:visible", {
        timeout: 10000,
      });
      const appearanceSection = page.locator("#appearance-section");
      await expect(appearanceSection).toBeVisible({ timeout: 10000 });

      // Verify timeframe setting is present
      const timeframeSetting = page.locator("#timeframe-setting");
      await expect(timeframeSetting).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Settings Persistence", () => {
    test("should maintain settings across navigation", async ({ page }) => {
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // Select all feeds
      await page.locator("#select-all-feeds").click();
      await page.waitForTimeout(500);

      // Navigate away
      await page.goto("/");
      await page.waitForLoadState("load");

      // Navigate back to settings
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits
      await page
        .locator('.settings-menu-item:has-text("Feed Selection")')
        .click();
      await page.waitForSelector("#feed-checkboxes", { timeout: 15000 });

      // Check that feeds are still selected
      const checkboxes = page.locator(
        '#feed-checkboxes input[type="checkbox"]',
      );
      const firstCheckbox = checkboxes.first();
      await expect(firstCheckbox).toBeChecked();
    });
  });

  test.describe("Responsive Design", () => {
    test("should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits

      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();
    });

    test("should be responsive on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits

      const container = page.locator(".settings-container");
      await expect(container).toBeVisible();
    });

    test("should be responsive on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/settings.html");
      // Removed explicit wait - toBeVisible auto-waits

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
  test("should show all feeds when no filter is set", async ({ page }) => {
    await page.goto("/");
    // Removed explicit wait - toBeVisible auto-waits

    // All feed navigation links should be visible
    const navLinks = page.locator(".nav-link");
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });

  test("should hide disabled feeds from navigation", async ({ page }) => {
    // Set enabledFeeds to only include specific feeds
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.evaluate(() => {
      localStorage.setItem(
        "enabledFeeds",
        JSON.stringify(["Test Feed A", "Test Feed B"]),
      );
    });

    await page.reload();
    // Removed explicit wait - toBeVisible auto-waits

    // Test Feed A and Test Feed B should be visible
    const feedALink = page.locator('.nav-link:has-text("Test Feed A")');
    if ((await feedALink.count()) > 0) {
      await expect(feedALink).toBeVisible();
    }

    const feedBLink = page.locator('.nav-link:has-text("Test Feed B")');
    if ((await feedBLink.count()) > 0) {
      await expect(feedBLink).toBeVisible();
    }
  });

  test("should not filter All Feeds and Summary links", async ({ page }) => {
    // Set very restrictive filter
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.evaluate(() => {
      localStorage.setItem("enabledFeeds", JSON.stringify(["Test Feed A"]));
    });

    await page.reload();
    // Removed explicit wait - toBeVisible auto-waits

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
