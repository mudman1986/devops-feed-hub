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

for (const theme of themes) {
  test(`screenshot: ${theme.name} (${theme.category})`, async ({ page }) => {
    // Navigate to experimental section to ensure settings are visible
    await goToExperimentalSection(page);

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
