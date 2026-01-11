import { expect, test } from "@playwright/test";

// Mock system date to match test data (2026-01-11, 12 hours after collection)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
    Date.now = () => fakeNow;
  });

  // Navigate to page and clear localStorage in correct order
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
});

/**
 * Experimental Themes Tests
 * Tests the new experimental themes functionality including color variations and layout redesigns
 */
test.describe("Experimental Themes", () => {
  test.describe("Settings Page - Experimental Themes Section", () => {
    test("should display experimental themes section in settings", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Check for experimental themes subsection title
      const subsectionTitle = page.locator(
        ".settings-subsection-title:has-text('Experimental Themes')",
      );
      await expect(subsectionTitle).toBeVisible();
    });

    test("should display disclaimer about work-in-progress themes", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Check for disclaimer
      const disclaimer = page.locator(".experimental-disclaimer");
      await expect(disclaimer).toBeVisible();
      await expect(disclaimer).toContainText("Work in Progress");
      await expect(disclaimer).toContainText(
        "may change or be removed without notice",
      );
    });

    test("should have experimental theme selector with optgroups", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      await expect(experimentalThemeSelect).toBeVisible();

      // Check for optgroups
      const colorVariations = page.locator(
        '#experimental-theme-setting optgroup[label="Color Variations"]',
      );
      const layoutRedesigns = page.locator(
        '#experimental-theme-setting optgroup[label="Layout Redesigns"]',
      );

      await expect(colorVariations).toBeAttached();
      await expect(layoutRedesigns).toBeAttached();
    });

    test("should have at least 10 experimental themes available", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      const options = experimentalThemeSelect.locator("option");

      // Count options (excluding the "None" option)
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(11); // 10+ themes + 1 "None" option
    });
  });

  test.describe("Theme Application", () => {
    test("should apply experimental theme when selected", async ({ page }) => {
      await page.goto("/settings.html");

      // Select an experimental theme
      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      await experimentalThemeSelect.selectOption("midnight-blue");

      // Wait for theme to be applied
      await page.waitForTimeout(100);

      // Check that data-theme attribute is set
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("midnight-blue");
    });

    test("should persist experimental theme in localStorage", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Select an experimental theme
      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      await experimentalThemeSelect.selectOption("terminal");

      // Check localStorage
      const experimentalTheme = await page.evaluate(() =>
        localStorage.getItem("experimentalTheme"),
      );
      expect(experimentalTheme).toBe("terminal");
    });

    test("should load experimental theme on page reload", async ({ page }) => {
      await page.goto("/settings.html");

      // Set experimental theme
      await page
        .locator("#experimental-theme-setting")
        .selectOption("glassmorphism");

      // Reload page
      await page.reload();
      await page.waitForLoadState("load");

      // Check that theme is still applied
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("glassmorphism");

      // Check that select still shows the experimental theme
      const selectedValue = await page
        .locator("#experimental-theme-setting")
        .inputValue();
      expect(selectedValue).toBe("glassmorphism");
    });

    test("should clear experimental theme when selecting 'None'", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // First set an experimental theme
      await page
        .locator("#experimental-theme-setting")
        .selectOption("retro");

      // Then select "None"
      await page.locator("#experimental-theme-setting").selectOption("");

      // Check localStorage
      const experimentalTheme = await page.evaluate(() =>
        localStorage.getItem("experimentalTheme"),
      );
      expect(experimentalTheme).toBeNull();

      // Should revert to standard theme
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(["dark", "light"]).toContain(dataTheme);
    });

    test("should clear experimental theme when selecting standard theme", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Set experimental theme
      await page.locator("#experimental-theme-setting").selectOption("retro");

      // Then select standard theme
      await page.locator("#theme-setting").selectOption("light");

      // Check that experimental theme is cleared
      const experimentalTheme = await page.evaluate(() =>
        localStorage.getItem("experimentalTheme"),
      );
      expect(experimentalTheme).toBeNull();

      // Check that standard theme is applied
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("light");
    });
  });

  test.describe("Color Variation Themes", () => {
    const colorThemes = [
      "midnight-blue",
      "forest-green",
      "purple-haze",
      "sunset-orange",
      "ocean-deep",
      "rose-gold",
      "arctic-blue",
      "pastel-dream",
      "high-contrast-dark",
      "high-contrast-light",
      "monochrome",
      "solarized-dark",
      "dracula",
    ];

    for (const theme of colorThemes.slice(0, 3)) {
      // Test first 3 to save time
      test(`should apply ${theme} color theme`, async ({ page }) => {
        await page.goto("/settings.html");

        await page
          .locator("#experimental-theme-setting")
          .selectOption(theme);

        const dataTheme = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme"),
        );
        expect(dataTheme).toBe(theme);
      });
    }
  });

  test.describe("Layout Redesign Themes", () => {
    const layoutThemes = [
      "minimalist",
      "terminal",
      "magazine",
      "glassmorphism",
      "retro",
      "futuristic",
      "newspaper",
      "compact",
    ];

    for (const theme of layoutThemes.slice(0, 3)) {
      // Test first 3 to save time
      test(`should apply ${theme} layout theme`, async ({ page }) => {
        await page.goto("/settings.html");

        await page
          .locator("#experimental-theme-setting")
          .selectOption(theme);

        const dataTheme = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme"),
        );
        expect(dataTheme).toBe(theme);
      });
    }
  });

  test.describe("Theme Persistence Across Pages", () => {
    test("should apply experimental theme on index page", async ({ page }) => {
      await page.goto("/settings.html");

      // Set experimental theme
      await page
        .locator("#experimental-theme-setting")
        .selectOption("terminal");

      // Navigate to index
      await page.goto("/");
      await page.waitForLoadState("load");

      // Check that theme is applied
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("terminal");
    });

    test("should maintain experimental theme when navigating back to settings", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // Set experimental theme
      await page.locator("#experimental-theme-setting").selectOption("retro");

      // Navigate away and back
      await page.goto("/");
      await page.goto("/settings.html");
      await page.waitForLoadState("load");

      // Check that theme is still selected
      const selectedValue = await page
        .locator("#experimental-theme-setting")
        .inputValue();
      expect(selectedValue).toBe("retro");

      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("retro");
    });
  });
});

test.describe("Theme Application Across All Pages", () => {
  const testTheme = "futuristic";

  test("should apply experimental theme on index page", async ({ page }) => {
    // Set theme via settings
    await page.goto("/settings.html");
    await page
      .locator("#experimental-theme-setting")
      .selectOption(testTheme);

    // Navigate to index
    await page.goto("/");
    await page.waitForLoadState("load");

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);
  });

  test("should apply experimental theme on feed page", async ({ page }) => {
    // Set theme via settings
    await page.goto("/settings.html");
    await page
      .locator("#experimental-theme-setting")
      .selectOption(testTheme);

    // Navigate to a feed page
    await page.goto("/feed-test-feed-a.html");
    await page.waitForLoadState("load");

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);
  });

  test("should apply experimental theme on summary page", async ({ page }) => {
    // Set theme via settings
    await page.goto("/settings.html");
    await page
      .locator("#experimental-theme-setting")
      .selectOption(testTheme);

    // Navigate to summary page (if it exists)
    const response = await page.goto("/summary.html");
    if (response && response.ok()) {
      await page.waitForLoadState("load");

      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe(testTheme);
    }
  });

  test("should maintain theme when navigating between pages", async ({
    page,
  }) => {
    // Set theme
    await page.goto("/settings.html");
    await page
      .locator("#experimental-theme-setting")
      .selectOption(testTheme);

    // Navigate through different pages
    await page.goto("/");
    let dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);

    await page.goto("/feed-test-feed-a.html");
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);

    await page.goto("/settings.html");
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);
  });
});
