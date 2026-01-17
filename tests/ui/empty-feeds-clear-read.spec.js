import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock Date.now() to return a fixed timestamp for consistent timeframe filtering
  await page.addInitScript(() => {
    const fakeNow = new Date("2026-01-11T00:00:00Z").getTime();
    Date.now = () => fakeNow;
  });

  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(500);
});

test.describe("Empty Feeds with No Articles Across All Timeframes", () => {
  test("Feeds with 0 articles stay at bottom after clicking clear read", async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForSelector(".feed-section", { timeout: 5000 });

    // Mark some articles as read first
    await page.evaluate(() => {
      const articles = document.querySelectorAll(
        ".article-item .article-title",
      );
      const readArticles = [];
      for (let i = 0; i < Math.min(5, articles.length); i++) {
        const url = articles[i].getAttribute("href");
        if (url) readArticles.push(url);
      }
      if (readArticles.length > 0) {
        localStorage.setItem("readArticles", JSON.stringify(readArticles));
      }
    });

    // Reload to apply read status
    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Get feed order before clicking clear read
    const orderBeforeClear = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections).map((section) => {
        const h3 = section.querySelector("h3");
        const firstChild = h3?.childNodes[0];
        const name = firstChild ? firstChild.textContent.trim() : "";
        const countText =
          section.querySelector(".feed-count")?.textContent || "";
        const count = parseInt(countText.match(/(\d+)/)?.[1] || "0");
        return { name, count };
      });
    });

    console.log("Order before clear:", orderBeforeClear);

    // Click "clear all read" button
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#reset-read-button").click();
    await page.waitForTimeout(1500);

    // Get feed order after clicking clear read
    const orderAfterClear = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections).map((section) => {
        const h3 = section.querySelector("h3");
        const firstChild = h3?.childNodes[0];
        const name = firstChild ? firstChild.textContent.trim() : "";
        const countText =
          section.querySelector(".feed-count")?.textContent || "";
        const count = parseInt(countText.match(/(\d+)/)?.[1] || "0");
        const hasArticleList = section.querySelector(".article-list") !== null;
        return { name, count, hasArticleList };
      });
    });

    console.log("Order after clear:", orderAfterClear);

    // Find feeds with 0 articles (no article-list element)
    const emptyFeeds = orderAfterClear.filter(
      (f) => f.count === 0 && !f.hasArticleList,
    );
    const nonEmptyFeeds = orderAfterClear.filter((f) => f.count > 0);

    console.log("Empty feeds (no article-list):", emptyFeeds);
    console.log("Non-empty feeds:", nonEmptyFeeds);

    // Verify empty feeds are at the bottom
    if (emptyFeeds.length > 0 && nonEmptyFeeds.length > 0) {
      const emptyFeedNames = emptyFeeds.map((f) => f.name);
      const nonEmptyFeedNames = nonEmptyFeeds.map((f) => f.name);

      // Get indices
      const emptyFeedIndices = emptyFeedNames.map((name) =>
        orderAfterClear.findIndex((f) => f.name === name),
      );
      const nonEmptyFeedIndices = nonEmptyFeedNames.map((name) =>
        orderAfterClear.findIndex((f) => f.name === name),
      );

      const minEmptyIndex = Math.min(...emptyFeedIndices);
      const maxNonEmptyIndex = Math.max(...nonEmptyFeedIndices);

      console.log("Min empty feed index:", minEmptyIndex);
      console.log("Max non-empty feed index:", maxNonEmptyIndex);

      // Empty feeds should be after non-empty feeds
      expect(minEmptyIndex).toBeGreaterThan(maxNonEmptyIndex);
    }
  });

  test("Feeds without article-list are included in reordering", async ({
    page,
  }) => {
    await page.waitForSelector(".feed-section", { timeout: 5000 });
    await page.waitForTimeout(500);

    // Click clear read to trigger reordering
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#reset-read-button").click();
    await page.waitForTimeout(1500);

    // Check that feeds without article-list are still in the DOM and positioned correctly
    const feedData = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections).map((section, index) => {
        const h3 = section.querySelector("h3");
        const firstChild = h3?.childNodes[0];
        const name = firstChild ? firstChild.textContent.trim() : "";
        const hasArticleList = section.querySelector(".article-list") !== null;
        const hasNoArticlesMsg = section.querySelector(".no-articles") !== null;
        return { name, index, hasArticleList, hasNoArticlesMsg };
      });
    });

    console.log("Feed data:", feedData);

    // Find feeds without article-list
    const feedsWithoutArticleList = feedData.filter((f) => !f.hasArticleList);

    // These feeds should have a "no-articles" message instead
    feedsWithoutArticleList.forEach((feed) => {
      expect(feed.hasNoArticlesMsg).toBe(true);
    });

    // Verify they are positioned at the end
    if (feedsWithoutArticleList.length > 0) {
      const feedsWithArticleList = feedData.filter((f) => f.hasArticleList);

      if (feedsWithArticleList.length > 0) {
        const maxArticleListIndex = Math.max(
          ...feedsWithArticleList.map((f) => f.index),
        );
        const minNoArticleListIndex = Math.min(
          ...feedsWithoutArticleList.map((f) => f.index),
        );

        expect(minNoArticleListIndex).toBeGreaterThan(maxArticleListIndex);
      }
    }
  });
});
