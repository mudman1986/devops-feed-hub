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

      // Check for optgroups in theme selector
      const colorVariationsDark = page.locator(
        '#experimental-theme-setting optgroup[label="Color Variations - Dark"]',
      );
      const colorVariationsLight = page.locator(
        '#experimental-theme-setting optgroup[label="Color Variations - Light"]',
      );
      const themedStyles = page.locator(
        '#experimental-theme-setting optgroup[label="Themed Styles"]',
      );

      await expect(colorVariationsDark).toBeAttached();
      await expect(colorVariationsLight).toBeAttached();
      await expect(themedStyles).toBeAttached();

      // Check viewmode selector
      const experimentalViewmodeSelect = page.locator(
        "#experimental-viewmode-setting",
      );
      await expect(experimentalViewmodeSelect).toBeVisible();

      const alternativeLayouts = page.locator(
        '#experimental-viewmode-setting optgroup[label="Alternative Layouts"]',
      );
      await expect(alternativeLayouts).toBeAttached();
    });

    test("should have at least 22 experimental themes available (including light variants)", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      const options = experimentalThemeSelect.locator("option");

      // Count options (excluding the "None" option)
      // 22 experimental themes + 1 "None" option = 23
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(23);
    });
  });

  test.describe("Theme Application", () => {
    test("should apply experimental theme when selected", async ({ page }) => {
      await page.goto("/settings.html");

      // Select an experimental theme
      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      await experimentalThemeSelect.selectOption("purple-haze");

      // Wait for theme to be applied
      await page.waitForTimeout(100);

      // Check that data-theme attribute is set
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("purple-haze");
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
        .selectOption("minimalist");

      // Reload page
      await page.reload();
      await page.waitForLoadState("load");

      // Check that theme is still applied
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(dataTheme).toBe("minimalist");

      // Check that select still shows the experimental theme
      const selectedValue = await page
        .locator("#experimental-theme-setting")
        .inputValue();
      expect(selectedValue).toBe("minimalist");
    });

    test("should clear experimental theme when selecting 'None'", async ({
      page,
    }) => {
      await page.goto("/settings.html");

      // First set an experimental theme
      await page.locator("#experimental-theme-setting").selectOption("retro");

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
      "purple-haze",
      "ocean-deep",
      "arctic-blue",
      "high-contrast-dark",
      "high-contrast-light",
      "monochrome",
      "dracula",
    ];

    for (const theme of colorThemes.slice(0, 3)) {
      // Test first 3 to save time
      test(`should apply ${theme} color theme`, async ({ page }) => {
        await page.goto("/settings.html");

        await page.locator("#experimental-theme-setting").selectOption(theme);

        const dataTheme = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme"),
        );
        expect(dataTheme).toBe(theme);
      });
    }
  });

  test.describe("Themed Style Themes", () => {
    const themedStyles = [
      "minimalist",
      "terminal",
      "retro",
      "futuristic",
      "compact",
    ];

    for (const theme of themedStyles.slice(0, 3)) {
      // Test first 3 to save time
      test(`should apply ${theme} themed style`, async ({ page }) => {
        await page.goto("/settings.html");

        await page.locator("#experimental-theme-setting").selectOption(theme);

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
    await page.locator("#experimental-theme-setting").selectOption(testTheme);

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
    await page.locator("#experimental-theme-setting").selectOption(testTheme);

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
    await page.locator("#experimental-theme-setting").selectOption(testTheme);

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
    await page.locator("#experimental-theme-setting").selectOption(testTheme);

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

test.describe("Light Mode Variants", () => {
  const lightThemes = [
    "purple-haze-light",
    "ocean-deep-light",
    "dracula-light",
  ];

  test("should have light mode variants for color themes", async ({ page }) => {
    await page.goto("/settings.html");

    for (const theme of lightThemes) {
      const option = page.locator(
        `#experimental-theme-setting option[value="${theme}"]`,
      );
      await expect(option).toBeAttached();
    }
  });

  test("should apply light mode variant theme", async ({ page }) => {
    await page.goto("/settings.html");

    await page
      .locator("#experimental-theme-setting")
      .selectOption("purple-haze-light");

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("purple-haze-light");
  });

  test("should persist light mode variant across pages", async ({ page }) => {
    await page.goto("/settings.html");

    await page
      .locator("#experimental-theme-setting")
      .selectOption("ocean-deep-light");

    await page.goto("/");
    await page.waitForLoadState("load");

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("ocean-deep-light");
  });
});
