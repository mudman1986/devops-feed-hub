import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Generate test HTML with empty feeds
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
  await page.waitForSelector(".feed-section", { timeout: 10000 });
});

test.describe("Feed Ordering - Comprehensive Empty Feed Tests", () => {
  test("Initial load: feeds with articles first, empty feeds last (alphabetically within groups)", async ({
    page,
  }) => {
    const feedSections = await page.locator(".feed-section").all();
    const feedNames = [];

    for (const section of feedSections) {
      // Extract feed name from h3, excluding the count badge
      const h3Element = await section.locator("h3");
      const feedName = await h3Element.evaluate((el) => {
        const firstChild = el.childNodes[0];
        return firstChild
          ? firstChild.textContent.trim()
          : el.textContent.trim();
      });
      feedNames.push(feedName);
    }

    // Expected order: 6 feeds with articles (alphabetically), then 3 empty feeds (alphabetically)
    // Feeds with articles: AWS DevOps Blog, Docker Blog, GitHub Blog, Test Feed A, Test Feed B, Test Feed C
    // Empty feeds: Atlassian DevOps, Opensource.com, Terraform weekly

    const feedsWithArticles = feedNames.slice(0, 6);
    const emptyFeeds = feedNames.slice(6, 9);

    // Verify feeds with articles are sorted alphabetically
    expect(feedsWithArticles).toEqual([
      "AWS DevOps Blog",
      "Docker Blog",
      "GitHub Blog",
      "Test Feed A",
      "Test Feed B",
      "Test Feed C",
    ]);

    // Verify empty feeds are sorted alphabetically
    expect(emptyFeeds).toEqual([
      "Atlassian DevOps",
      "Opensource.com",
      "Terraform weekly",
    ]);
  });

  test("After marking all articles as read: empty feeds still at bottom", async ({
    page,
  }) => {
    // Mark all articles as read
    await page.evaluate(() => {
      const articles = document.querySelectorAll(
        ".article-item .article-title",
      );
      const readArticles = [];
      articles.forEach((article) => {
        const url = article.getAttribute("href");
        if (url) readArticles.push(url);
      });
      if (readArticles.length > 0) {
        localStorage.setItem("readArticles", JSON.stringify(readArticles));
      }
    });

    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 10000 });
    await page.waitForTimeout(1000);

    const feedNames = [];
    const feedSections = await page.locator(".feed-section").all();

    for (const section of feedSections) {
      const h3Element = await section.locator("h3");
      const feedName = await h3Element.evaluate((el) => {
        const firstChild = el.childNodes[0];
        return firstChild
          ? firstChild.textContent.trim()
          : el.textContent.trim();
      });
      feedNames.push(feedName);
    }

    // After marking all as read, feeds should be ordered:
    // All 6 feeds with articles (all read) come first, then 3 empty feeds
    const feedsWithArticles = feedNames.slice(0, 6);
    const emptyFeeds = feedNames.slice(6, 9);

    // Verify all feeds with articles come before empty feeds
    expect(feedsWithArticles).toEqual([
      "AWS DevOps Blog",
      "Docker Blog",
      "GitHub Blog",
      "Test Feed A",
      "Test Feed B",
      "Test Feed C",
    ]);

    expect(emptyFeeds).toEqual([
      "Atlassian DevOps",
      "Opensource.com",
      "Terraform weekly",
    ]);
  });

  test("After clicking 'Clear Read': empty feeds remain at bottom", async ({
    page,
  }) => {
    // Mark some articles as read
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

    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click reset button
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator("#reset-read-button").click();
    await page.waitForTimeout(1000);

    const feedNames = [];
    const feedSections = await page.locator(".feed-section").all();

    for (const section of feedSections) {
      const h3Element = await section.locator("h3");
      const feedName = await h3Element.evaluate((el) => {
        const firstChild = el.childNodes[0];
        return firstChild
          ? firstChild.textContent.trim()
          : el.textContent.trim();
      });
      feedNames.push(feedName);
    }

    // After reset, should return to original order: 6 with articles, then 3 empty
    const feedsWithArticles = feedNames.slice(0, 6);
    const emptyFeeds = feedNames.slice(6, 9);

    expect(feedsWithArticles).toEqual([
      "AWS DevOps Blog",
      "Docker Blog",
      "GitHub Blog",
      "Test Feed A",
      "Test Feed B",
      "Test Feed C",
    ]);

    expect(emptyFeeds).toEqual([
      "Atlassian DevOps",
      "Opensource.com",
      "Terraform weekly",
    ]);
  });

  test("Feed names extracted correctly without count badge text", async ({
    page,
  }) => {
    // This test specifically verifies the bug fix
    const feedNames = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      const names = [];

      sections.forEach((section) => {
        const heading = section.querySelector("h3");
        if (heading) {
          // This is the CORRECT way to extract feed name (excluding count badge)
          const feedNameElement = heading.childNodes[0];
          const feedName = feedNameElement
            ? feedNameElement.textContent.trim()
            : heading.textContent.trim();
          names.push(feedName);

          // Also get the WRONG way (what the bug was doing)
          const wrongName = heading.textContent.trim();

          // The wrong way should include the count badge text
          if (wrongName.includes("articles")) {
            console.log(
              `✓ Feed name extraction: "${feedName}" vs wrong "${wrongName}"`,
            );
          }
        }
      });

      return names;
    });

    // Verify feed names don't contain "articles" text
    feedNames.forEach((name) => {
      expect(name).not.toContain("articles");
      expect(name).not.toContain("0");
      expect(name).not.toContain("3");
      expect(name).not.toContain("4");
    });
  });

  test("Timeframe change maintains empty feeds at bottom", async ({ page }) => {
    // Change timeframe to 7 days
    await page.selectOption("#timeframe-select", "7days");
    await page.waitForTimeout(1000);

    const feedNames = [];
    const feedSections = await page.locator(".feed-section").all();

    for (const section of feedSections) {
      const h3Element = await section.locator("h3");
      const feedName = await h3Element.evaluate((el) => {
        const firstChild = el.childNodes[0];
        return firstChild
          ? firstChild.textContent.trim()
          : el.textContent.trim();
      });
      feedNames.push(feedName);
    }

    // Empty feeds should still be at bottom
    const atlassianIndex = feedNames.indexOf("Atlassian DevOps");
    const opensourceIndex = feedNames.indexOf("Opensource.com");
    const terraformIndex = feedNames.indexOf("Terraform weekly");

    // All empty feeds should be after the 6 feeds with articles
    expect(atlassianIndex).toBeGreaterThan(5); // After 6 feeds with articles (index 5 is last)
    expect(opensourceIndex).toBeGreaterThan(5);
    expect(terraformIndex).toBeGreaterThan(5);
  });

  test("Empty feeds are sorted alphabetically within empty group", async ({
    page,
  }) => {
    const feedSections = await page.locator(".feed-section").all();
    const emptyFeeds = [];

    for (const section of feedSections) {
      const countText = await section.locator(".feed-count").textContent();
      if (countText && countText.includes("0 articles")) {
        const h3Element = await section.locator("h3");
        const feedName = await h3Element.evaluate((el) => {
          const firstChild = el.childNodes[0];
          return firstChild
            ? firstChild.textContent.trim()
            : el.textContent.trim();
        });
        emptyFeeds.push(feedName);
      }
    }

    // Empty feeds should be: Atlassian DevOps, Opensource.com, Terraform weekly (alphabetically)
    expect(emptyFeeds).toEqual([
      "Atlassian DevOps",
      "Opensource.com",
      "Terraform weekly",
    ]);
  });

  test("Feeds with articles are sorted alphabetically within non-empty group", async ({
    page,
  }) => {
    const feedSections = await page.locator(".feed-section").all();
    const nonEmptyFeeds = [];

    for (const section of feedSections) {
      const countText = await section.locator(".feed-count").textContent();
      const match = countText ? countText.match(/(\d+)/) : null;
      const count = match ? parseInt(match[1]) : 0;

      if (count > 0) {
        const h3Element = await section.locator("h3");
        const feedName = await h3Element.evaluate((el) => {
          const firstChild = el.childNodes[0];
          return firstChild
            ? firstChild.textContent.trim()
            : el.textContent.trim();
        });
        nonEmptyFeeds.push(feedName);
      }
    }

    // Non-empty feeds should be all 6 feeds with articles (alphabetically)
    expect(nonEmptyFeeds).toEqual([
      "AWS DevOps Blog",
      "Docker Blog",
      "GitHub Blog",
      "Test Feed A",
      "Test Feed B",
      "Test Feed C",
    ]);
  });
});
