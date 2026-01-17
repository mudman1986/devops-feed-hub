import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(500);
});

test.describe("Feed Ordering Across Timeframe Changes with Read Articles", () => {
  test("Feeds with all read articles stay below feeds with unread when switching timeframes", async ({
    page,
  }) => {
    await page.waitForSelector(".feed-section", { timeout: 5000 });
    await page.waitForTimeout(500);

    // Step 1: Go to 7-day timeframe
    await page.selectOption("#timeframe-select", "7days");
    await page.waitForTimeout(1000);

    // Get feed names and mark all articles in one specific feed as read
    const feedToMarkRead = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      let targetFeed = null;

      // Find a feed with articles
      for (const section of sections) {
        const articles = section.querySelectorAll(".article-item");
        const visibleArticles = Array.from(articles).filter(
          (a) => a.style.display !== "none",
        );
        if (visibleArticles.length > 0) {
          const h3 = section.querySelector("h3");
          const firstChild = h3?.childNodes[0];
          const feedName = firstChild ? firstChild.textContent.trim() : "";

          // Mark all articles in this feed as read
          const readArticles = [];
          visibleArticles.forEach((article) => {
            const link = article.querySelector(".article-title");
            const url = link?.getAttribute("href");
            if (url) readArticles.push(url);
          });

          if (readArticles.length > 0) {
            localStorage.setItem("readArticles", JSON.stringify(readArticles));
            targetFeed = feedName;
            break;
          }
        }
      }

      return targetFeed;
    });

    console.log("Marked all articles as read in feed:", feedToMarkRead);

    // Reload to apply read status
    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify it's in 7-day timeframe
    const timeframe7day = await page.locator("#timeframe-select").inputValue();
    expect(timeframe7day).toBe("7days");

    // Step 2: Verify the feed moved below feeds with unread articles
    const orderIn7Days = await page.evaluate((targetFeed) => {
      const sections = document.querySelectorAll(".feed-section");
      const feedOrder = [];

      sections.forEach((section) => {
        const h3 = section.querySelector("h3");
        const firstChild = h3?.childNodes[0];
        const feedName = firstChild ? firstChild.textContent.trim() : "";

        const articles = section.querySelectorAll(".article-item");
        const visibleArticles = Array.from(articles).filter(
          (a) => a.style.display !== "none",
        );
        const unreadArticles = Array.from(articles).filter((article) => {
          const link = article.querySelector(".article-title");
          if (!link) return false;
          const url = link.getAttribute("href");
          const readArticles = JSON.parse(
            localStorage.getItem("readArticles") || "[]",
          );
          return (
            !readArticles.includes(url) &&
            !article.hasAttribute("data-hidden-by-timeframe")
          );
        });

        feedOrder.push({
          name: feedName,
          visibleCount: visibleArticles.length,
          unreadCount: unreadArticles.length,
        });
      });

      return feedOrder;
    }, feedToMarkRead);

    console.log("Feed order in 7-day timeframe:", orderIn7Days);

    // Find the target feed and verify it's positioned correctly
    const targetFeedIn7Days = orderIn7Days.find(
      (f) => f.name === feedToMarkRead,
    );
    const feedsWithUnreadIn7Days = orderIn7Days.filter(
      (f) => f.unreadCount > 0,
    );

    if (feedsWithUnreadIn7Days.length > 0 && targetFeedIn7Days) {
      const targetIndex = orderIn7Days.indexOf(targetFeedIn7Days);
      const maxUnreadIndex = Math.max(
        ...feedsWithUnreadIn7Days.map((f) => orderIn7Days.indexOf(f)),
      );

      // The feed with all read articles should be after feeds with unread
      expect(targetIndex).toBeGreaterThan(maxUnreadIndex);
    }

    // Step 3: Switch to 24-hour timeframe
    await page.selectOption("#timeframe-select", "1day");
    await page.waitForTimeout(1500);

    // Verify timeframe changed
    const timeframe1day = await page.locator("#timeframe-select").inputValue();
    expect(timeframe1day).toBe("1day");

    // Step 4: Verify the feed is STILL below feeds with unread articles
    const orderIn1Day = await page.evaluate((targetFeed) => {
      const sections = document.querySelectorAll(".feed-section");
      const feedOrder = [];

      sections.forEach((section) => {
        const h3 = section.querySelector("h3");
        const firstChild = h3?.childNodes[0];
        const feedName = firstChild ? firstChild.textContent.trim() : "";

        const articles = section.querySelectorAll(".article-item");
        const visibleArticles = Array.from(articles).filter(
          (a) => a.style.display !== "none",
        );
        const unreadArticles = Array.from(articles).filter((article) => {
          const link = article.querySelector(".article-title");
          if (!link) return false;
          const url = link.getAttribute("href");
          const readArticles = JSON.parse(
            localStorage.getItem("readArticles") || "[]",
          );
          return (
            !readArticles.includes(url) &&
            !article.hasAttribute("data-hidden-by-timeframe")
          );
        });

        feedOrder.push({
          name: feedName,
          visibleCount: visibleArticles.length,
          unreadCount: unreadArticles.length,
        });
      });

      return feedOrder;
    }, feedToMarkRead);

    console.log("Feed order in 1-day timeframe:", orderIn1Day);

    // Find the target feed in new timeframe
    const targetFeedIn1Day = orderIn1Day.find((f) => f.name === feedToMarkRead);
    const feedsWithUnreadIn1Day = orderIn1Day.filter((f) => f.unreadCount > 0);

    // CRITICAL: If the target feed still has visible articles (even if all read),
    // it should be BELOW feeds with unread articles
    if (
      targetFeedIn1Day &&
      targetFeedIn1Day.visibleCount > 0 &&
      feedsWithUnreadIn1Day.length > 0
    ) {
      const targetIndex = orderIn1Day.indexOf(targetFeedIn1Day);
      const maxUnreadIndex = Math.max(
        ...feedsWithUnreadIn1Day.map((f) => orderIn1Day.indexOf(f)),
      );

      console.log(`Target feed "${feedToMarkRead}" is at index ${targetIndex}`);
      console.log(`Last feed with unread is at index ${maxUnreadIndex}`);

      // This is the key assertion: feeds with all read articles should be
      // BELOW feeds with unread articles, even after switching timeframes
      expect(targetIndex).toBeGreaterThan(maxUnreadIndex);
    }
  });
});
