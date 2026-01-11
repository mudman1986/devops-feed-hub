import { test } from "@playwright/test";

/**
 * Screenshot Generator for Experimental Themes
 * Generates screenshots of different themes for documentation
 */

const themes = [
  // Color variations
  { name: "midnight-blue", category: "color" },
  { name: "forest-green", category: "color" },
  { name: "purple-haze", category: "color" },
  { name: "dracula", category: "color" },
  
  // Layout redesigns
  { name: "minimalist", category: "layout" },
  { name: "terminal", category: "layout" },
  { name: "magazine", category: "layout" },
  { name: "glassmorphism", category: "layout" },
  { name: "retro", category: "layout" },
  { name: "futuristic", category: "layout" },
  { name: "newspaper", category: "layout" },
  { name: "compact", category: "layout" },
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
    await page.locator("#experimental-theme-setting").selectOption(theme.name);

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
