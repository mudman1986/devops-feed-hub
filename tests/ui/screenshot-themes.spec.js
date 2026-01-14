import { test } from "@playwright/test";

/**
 * Screenshot Generator for Experimental Themes
 * Generates screenshots of different themes for documentation
 */

const themes = [
  // Color variations
  { name: "purple-haze", category: "color" },
  { name: "ocean-deep", category: "color" },
  { name: "dracula", category: "color" },
  { name: "monochrome", category: "color" },

  // Themed styles
  { name: "minimalist", category: "themed" },
  { name: "terminal", category: "themed" },
  { name: "retro", category: "themed" },
  { name: "futuristic", category: "themed" },
  { name: "compact", category: "themed" },

  // Alternative layouts (viewmodes)
  { name: "horizontal-scroll", category: "viewmode" },
  { name: "masonry-grid", category: "viewmode" },
  { name: "center-stage", category: "viewmode" },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
});

for (const theme of themes) {
  test(`screenshot: ${theme.name} (${theme.category})`, async ({ page }) => {
    // Set the theme
    await page.goto("/settings.html");

    // Use appropriate selector based on category
    if (theme.category === "viewmode") {
      await page
        .locator("#experimental-viewmode-setting")
        .selectOption(theme.name);
    } else {
      await page
        .locator("#experimental-theme-setting")
        .selectOption(theme.name);
    }

    // Go to index page for screenshot
    await page.goto("/");
    await page.waitForLoadState("load");
    await page.waitForTimeout(500); // Let theme apply

    // Take screenshot
    await page.screenshot({
      path: `/tmp/theme-${theme.name}.png`,
      fullPage: false,
    });
  });
}
