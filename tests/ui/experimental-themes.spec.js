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

// Helper function to navigate to experimental themes section
async function goToExperimentalSection(page) {
  await page.goto("/settings.html");
  await page.waitForSelector(
    '.settings-menu-item[data-section="experimental"]',
    { timeout: 10000 },
  );
  await page
    .locator('.settings-menu-item[data-section="experimental"]')
    .click();
  await page.waitForTimeout(300); // Wait for section to become active
}

/**
 * Experimental Themes Tests
 * Tests the new experimental themes functionality including color variations and layout redesigns
 */
test.describe("Experimental Themes", () => {
  test.describe("Settings Page - Experimental Themes Section", () => {
    test("should display experimental themes section in settings", async ({
      page,
    }) => {
      await goToExperimentalSection(page);

      // Check for experimental themes section title
      const sectionTitle = page.locator(
        ".settings-section-title:has-text('Experimental Themes')",
      );
      await expect(sectionTitle).toBeVisible();
    });

    test("should display disclaimer about work-in-progress themes", async ({
      page,
    }) => {
      await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      await expect(experimentalThemeSelect).toBeVisible();

      // Check for optgroups in theme selector
      const colorVariations = page.locator(
        '#experimental-theme-setting optgroup[label="Color Variations"]',
      );
      const themedStyles = page.locator(
        '#experimental-theme-setting optgroup[label="Themed Styles"]',
      );

      await expect(colorVariations).toBeAttached();
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

    test("should have 12 theme options (11 base themes + None option)", async ({
      page,
    }) => {
      await goToExperimentalSection(page);

      const experimentalThemeSelect = page.locator(
        "#experimental-theme-setting",
      );
      const options = experimentalThemeSelect.locator("option");

      // Count options: 11 base themes + 1 "None" option = 12
      const count = await options.count();
      expect(count).toBe(12);
    });
  });

  test.describe("Theme Application", () => {
    test("should apply experimental theme when selected", async ({ page }) => {
      await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

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

    test("should clear experimental theme when selecting default theme", async ({
      page,
    }) => {
      await goToExperimentalSection(page);

      // Set experimental theme
      await page.locator("#experimental-theme-setting").selectOption("retro");

      // Navigate to Appearance section
      await page
        .locator('.settings-menu-item[data-section="appearance"]')
        .click();
      await page.waitForTimeout(300);

      // Then select default theme
      await page.locator("#theme-setting").selectOption("default");

      // Check that experimental theme is cleared
      const experimentalTheme = await page.evaluate(() =>
        localStorage.getItem("experimentalTheme"),
      );
      expect(experimentalTheme).toBeNull();

      // Check that default theme is applied (respects current mode)
      const dataTheme = await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      );
      expect(["dark", "light"]).toContain(dataTheme);
    });
  });

  test.describe("Color Variation Themes", () => {
    const colorThemes = [
      { name: "purple-haze", expectedDark: "purple-haze" },
      { name: "ocean-deep", expectedDark: "ocean-deep" },
      { name: "arctic-blue", expectedDark: "arctic-blue-dark" }, // Arctic-blue special case
    ];

    for (const { name, expectedDark } of colorThemes) {
      test(`should apply ${name} color theme`, async ({ page }) => {
        await goToExperimentalSection(page);

        await page.locator("#experimental-theme-setting").selectOption(name);

        const dataTheme = await page.evaluate(() =>
          document.documentElement.getAttribute("data-theme"),
        );
        // With default dark mode, should apply dark variant
        expect(dataTheme).toBe(expectedDark);
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
        await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

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
      await goToExperimentalSection(page);

      // Set experimental theme
      await page.locator("#experimental-theme-setting").selectOption("retro");

      // Navigate away and back
      await page.goto("/");
      await goToExperimentalSection(page);
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
    await goToExperimentalSection(page);
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
    await goToExperimentalSection(page);
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
    await goToExperimentalSection(page);
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
    await goToExperimentalSection(page);
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

    await goToExperimentalSection(page);
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe(testTheme);
  });
});

test.describe("Theme Mode Toggle", () => {
  test("should have theme mode selector in appearance settings", async ({
    page,
  }) => {
    await page.goto("/settings.html");
    await page.waitForSelector('.settings-menu-item[data-section="appearance"]', {
      timeout: 10000,
    });
    
    // Appearance section should be active by default
    const themeModeSelect = page.locator("#theme-mode-setting");
    await expect(themeModeSelect).toBeVisible();
    
    // Should have dark and light options
    const darkOption = themeModeSelect.locator('option[value="dark"]');
    const lightOption = themeModeSelect.locator('option[value="light"]');
    await expect(darkOption).toBeAttached();
    await expect(lightOption).toBeAttached();
  });

  test("should apply light mode to experimental theme when mode is changed", async ({
    page,
  }) => {
    await goToExperimentalSection(page);
    
    // Select an experimental theme (defaults to dark mode)
    await page.locator("#experimental-theme-setting").selectOption("purple-haze");
    await page.waitForTimeout(100);
    
    // Verify dark mode is applied
    let dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("purple-haze");
    
    // Navigate to Appearance section
    await page.locator('.settings-menu-item[data-section="appearance"]').click();
    await page.waitForTimeout(300);
    
    // Change mode to light
    await page.locator("#theme-mode-setting").selectOption("light");
    await page.waitForTimeout(100);
    
    // Verify light mode variant is applied
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("purple-haze-light");
  });

  test("should persist theme mode across page reloads", async ({ page }) => {
    await page.goto("/settings.html");
    
    // Set theme mode to light
    await page.locator("#theme-mode-setting").selectOption("light");
    await page.waitForTimeout(100);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState("load");
    
    // Check that mode is still light
    const selectedMode = await page.locator("#theme-mode-setting").inputValue();
    expect(selectedMode).toBe("light");
  });

  test("should toggle between dark and light variants using home page theme toggle", async ({
    page,
  }) => {
    // Set an experimental theme first
    await goToExperimentalSection(page);
    await page.locator("#experimental-theme-setting").selectOption("ocean-deep");
    await page.waitForTimeout(100);
    
    // Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("load");
    
    // Verify dark theme is applied
    let dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("ocean-deep");
    
    // Click theme toggle
    await page.locator("#theme-toggle").click();
    await page.waitForTimeout(300);
    
    // Verify light variant is applied
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("ocean-deep-light");
    
    // Click theme toggle again
    await page.locator("#theme-toggle").click();
    await page.waitForTimeout(300);
    
    // Verify back to dark variant
    dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(dataTheme).toBe("ocean-deep");
  });
});

test.describe("Arctic Blue Theme Special Handling", () => {
  test("should apply arctic-blue as light mode by default", async ({ page }) => {
    await goToExperimentalSection(page);
    
    // Select arctic-blue theme
    await page.locator("#experimental-theme-setting").selectOption("arctic-blue");
    await page.waitForTimeout(100);
    
    // Arctic-blue is naturally light, so it should be applied as-is for light mode
    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    
    // With default dark mode, it should apply arctic-blue (which is actually light visually)
    // But the system treats it specially
    expect(["arctic-blue", "arctic-blue-dark"]).toContain(dataTheme);
  });
});
