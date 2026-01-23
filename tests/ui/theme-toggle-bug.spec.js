const { test, expect } = require("@playwright/test");

/**
 * Bug Reproduction Tests: Theme Toggle Bug
 *
 * Bug Report: "Choose a random theme > theme gets selected > click on the
 * dark/light button > theme disappears"
 *
 * Expected Behavior:
 * - Selecting an experimental theme (e.g., purple-haze) should persist when
 *   toggling between light/dark modes
 * - The theme should become "purple-haze-light" or "purple-haze" (not just
 *   "light" or "dark")
 *
 * This test file specifically tests the theme toggle button (#theme-toggle)
 * behavior to ensure experimental themes don't disappear.
 */

test.describe("Theme Toggle Bug - Experimental Themes Disappearing", () => {
  test.beforeEach(async ({ page }) => {
    // Set up consistent test environment
    await page.addInitScript(() => {
      const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
      Date.now = () => fakeNow;
    });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Scenario 1: purple-haze theme should persist when toggling to light mode", async ({
    page,
  }) => {
    // Step 1: Navigate to settings and select purple-haze theme
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("purple-haze");

    // Verify theme is set (purple-haze is dark by default)
    let dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    let experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("purple-haze");

    // Step 2: Navigate back to home page
    await page.goto("/");
    await page.waitForLoadState("load");

    // Verify theme persists on home page
    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    // Step 3: Click the toggle button to switch to light mode
    const toggleButton = page.locator("#theme-toggle");
    await toggleButton.click();

    // Wait for toggle to complete
    await page.waitForTimeout(500);

    // Step 4: CRITICAL TEST - Theme should be "purple-haze-light", NOT just "light"
    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze-light");

    experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("purple-haze-light");

    // Verify the theme has NOT disappeared (regression test)
    expect(dataTheme).not.toBe("light");
    expect(dataTheme).toContain("purple-haze");
  });

  test("Scenario 2: purple-haze theme should toggle back to dark mode correctly", async ({
    page,
  }) => {
    // Step 1: Set up purple-haze theme (starts as dark)
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("purple-haze");

    // Verify initial theme
    let dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    // Step 2: Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("load");

    // Step 3: Toggle to light mode first
    const toggleButton = page.locator("#theme-toggle");
    await toggleButton.click();
    await page.waitForTimeout(500);

    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze-light");

    // Step 4: Toggle back to dark mode
    await toggleButton.click();
    await page.waitForTimeout(500);

    // Step 5: CRITICAL TEST - Theme should be "purple-haze", NOT just "dark"
    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    const experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("purple-haze");

    // Verify the theme has NOT disappeared (regression test)
    expect(dataTheme).not.toBe("dark");
    expect(dataTheme).toContain("purple-haze");
  });

  test("Scenario 3: arctic-blue theme should persist when toggling (special case - naturally light)", async ({
    page,
  }) => {
    // Step 1: Select arctic-blue in settings
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("arctic-blue");

    // BUG REPRODUCTION: arctic-blue should remain "arctic-blue" but gets converted to "arctic-blue-dark"
    // This is because settings.html applies the current themeMode (defaults to "dark") to ALL themes
    // Arctic-blue is naturally light and should stay "arctic-blue" when selected
    let dataTheme = await page.locator("html").getAttribute("data-theme");

    // CURRENT BUGGY BEHAVIOR: Theme becomes "arctic-blue-dark" immediately
    // EXPECTED BEHAVIOR: Theme should be "arctic-blue" (its natural light mode)
    // This test FAILS to demonstrate the bug
    expect(dataTheme).toBe("arctic-blue"); // This will FAIL with current code

    // Step 2: Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("load");

    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("arctic-blue");

    // Step 3: Click toggle button to switch to dark
    const toggleButton = page.locator("#theme-toggle");
    await toggleButton.click();

    // Wait for toggle to complete
    await page.waitForTimeout(500);

    // Step 4: CRITICAL TEST - Theme should become "arctic-blue-dark"
    dataTheme = await page.locator("html").getAttribute("data-theme");

    expect(dataTheme).toBe("arctic-blue-dark");

    const experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("arctic-blue-dark");

    // Verify the theme has NOT disappeared
    expect(dataTheme).not.toBe("dark");
    expect(dataTheme).toContain("arctic-blue");
  });

  test("Scenario 4: BOTH view mode and theme should persist when toggling", async ({
    page,
  }) => {
    // Step 1: Set up center-stage view mode AND purple-haze theme
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    // Select view mode
    const viewDropdown = page.locator("#view-setting");
    await viewDropdown.selectOption("center-stage");

    // Select theme
    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("purple-haze");

    // Verify both are set
    let dataView = await page.locator("html").getAttribute("data-view");
    expect(dataView).toContain("center-stage");

    let dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    // Step 2: Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("load");

    dataView = await page.locator("html").getAttribute("data-view");
    expect(dataView).toContain("center-stage");

    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze");

    // Step 3: Click toggle button
    const toggleButton = page.locator("#theme-toggle");
    await toggleButton.click();

    // Wait for toggle to complete
    await page.waitForTimeout(500);

    // Step 4: CRITICAL TEST - BOTH theme and view mode should persist
    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("purple-haze-light");

    dataView = await page.locator("html").getAttribute("data-view");
    expect(dataView).toContain("center-stage");

    // Verify neither has disappeared
    expect(dataTheme).not.toBe("light");
    expect(dataTheme).toContain("purple-haze");
    expect(dataView).toContain("center-stage");

    const experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("purple-haze-light");

    const experimentalViewMode = await page.evaluate(() =>
      localStorage.getItem("experimentalViewMode"),
    );
    expect(experimentalViewMode).toBe("center-stage");
  });

  test("Scenario 5: Multiple toggles should maintain theme integrity", async ({
    page,
  }) => {
    // Set up ocean-deep theme
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("ocean-deep");

    await page.goto("/");
    await page.waitForLoadState("load");

    const toggleButton = page.locator("#theme-toggle");

    // Toggle 1: dark -> light
    await toggleButton.click();
    await page.waitForTimeout(500);

    let dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("ocean-deep-light");
    expect(dataTheme).toContain("ocean-deep");

    // Toggle 2: light -> dark
    await toggleButton.click();
    await page.waitForTimeout(500);

    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("ocean-deep");
    expect(dataTheme).toContain("ocean-deep");

    // Toggle 3: dark -> light
    await toggleButton.click();
    await page.waitForTimeout(500);

    dataTheme = await page.locator("html").getAttribute("data-theme");
    expect(dataTheme).toBe("ocean-deep-light");
    expect(dataTheme).toContain("ocean-deep");

    // All toggles should maintain the base theme
    const experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toContain("ocean-deep");
  });

  test("Scenario 6: Toggling should update localStorage correctly for experimental themes", async ({
    page,
  }) => {
    // Set up dracula theme
    await page.goto("/settings.html");
    await page.waitForLoadState("load");

    const themeDropdown = page.locator("#theme-setting");
    await themeDropdown.selectOption("dracula");

    await page.goto("/");
    await page.waitForLoadState("load");

    // Before toggle
    let experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("dracula");

    // After toggle
    const toggleButton = page.locator("#theme-toggle");
    await toggleButton.click();
    await page.waitForTimeout(500);

    experimentalTheme = await page.evaluate(() =>
      localStorage.getItem("experimentalTheme"),
    );
    expect(experimentalTheme).toBe("dracula-light");

    // Most importantly, experimentalTheme should be set and contain the theme name
    expect(experimentalTheme).not.toBe("light");
    expect(experimentalTheme).toContain("dracula");
  });
});
