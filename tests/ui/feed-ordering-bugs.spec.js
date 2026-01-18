import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector(".feed-section", { timeout: 10000 });
});

test.describe("Feed Ordering - Empty Feeds", () => {
  test("Empty feeds should be at bottom", async ({ page }) => {
    const feedSections = await page.locator(".feed-section").all();
    const feedData = [];

    for (const section of feedSections) {
      const feedName = await section.locator("h2").textContent();
      const countText = await section.locator(".feed-count").textContent();
      const match = countText.match(/(\d+)/);
      const articleCount = match ? parseInt(match[1]) : 0;

      feedData.push({
        name: feedName.trim(),
        count: articleCount,
        index: feedData.length,
      });
    }

    const firstEmptyFeed = feedData.find((f) => f.count === 0);
    const firstNonEmptyFeed = feedData.find((f) => f.count > 0);

    if (firstEmptyFeed && firstNonEmptyFeed) {
      expect(firstEmptyFeed.index).toBeGreaterThan(firstNonEmptyFeed.index);
    }
  });

  test("After reset, empty feeds stay at bottom", async ({ page }) => {
    // Mark some articles as read
    await page.evaluate(() => {
      const articles = document.querySelectorAll(
        ".article-item .article-title",
      );
      const readArticles = [];
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const url = articles[i].getAttribute("href");
        if (url) readArticles.push(url);
      }
      if (readArticles.length > 0) {
        localStorage.setItem("readArticles", JSON.stringify(readArticles));
      }
    });

    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Reset read articles
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#reset-read-button").click();
    await page.waitForTimeout(1000);

    const feedSections = await page.locator(".feed-section").all();
    const feedData = [];

    for (const section of feedSections) {
      const feedName = await section.locator("h2").textContent();
      const countText = await section.locator(".feed-count").textContent();
      const match = countText.match(/(\d+)/);
      const articleCount = match ? parseInt(match[1]) : 0;

      feedData.push({
        name: feedName.trim(),
        count: articleCount,
        index: feedData.length,
      });
    }

    const emptyFeeds = feedData.filter((f) => f.count === 0);
    const nonEmptyFeeds = feedData.filter((f) => f.count > 0);

    if (emptyFeeds.length > 0 && nonEmptyFeeds.length > 0) {
      const maxNonEmptyIndex = Math.max(...nonEmptyFeeds.map((f) => f.index));
      const minEmptyIndex = Math.min(...emptyFeeds.map((f) => f.index));

      expect(minEmptyIndex).toBeGreaterThan(maxNonEmptyIndex);
    }
  });
});
