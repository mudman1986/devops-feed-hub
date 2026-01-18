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
  await page.waitForSelector(".feed-section", { timeout: 10000 });
});

test.describe("Feed Filter Navigation Tests", () => {
  test("Feeds hidden by filter should not be reordered", async ({ page }) => {
    // Disable some feeds via localStorage (simulating feed filter)
    await page.evaluate(() => {
      // Enable only 3 feeds, disable the rest
      const enabledFeeds = ["AWS DevOps Blog", "Docker Blog", "GitHub Blog"];
      localStorage.setItem("enabledFeeds", JSON.stringify(enabledFeeds));
    });

    // Reload page to apply filter
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Check that disabled feeds are hidden
    const hiddenFeeds = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections)
        .filter((s) => s.hasAttribute("data-hidden-by-filter"))
        .map((s) => {
          const h3 = s.querySelector("h2");
          const firstChild = h3?.childNodes[0];
          return firstChild ? firstChild.textContent.trim() : "";
        });
    });

    // Verify some feeds are hidden
    expect(hiddenFeeds.length).toBeGreaterThan(0);

    // Enable all feeds again
    await page.evaluate(() => {
      localStorage.removeItem("enabledFeeds");
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Get final order - should match initial order
    const finalOrder = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections).map((section) => {
        const h3 = section.querySelector("h2");
        const firstChild = h3?.childNodes[0];
        return firstChild ? firstChild.textContent.trim() : "";
      });
    });

    // Order should be preserved after hiding/showing feeds
    // Feeds are grouped: (1) feeds with articles, (2) empty feeds
    // Within each group, they're sorted alphabetically
    const awsIndex = finalOrder.indexOf("AWS DevOps Blog");
    const atlassianIndex = finalOrder.indexOf("Atlassian DevOps");
    const dockerIndex = finalOrder.indexOf("Docker Blog");
    const githubIndex = finalOrder.indexOf("GitHub Blog");
    const opensourceIndex = finalOrder.indexOf("Opensource.com");

    // Feeds with articles should come before empty feeds
    expect(awsIndex).toBeLessThan(atlassianIndex); // AWS (has articles) before Atlassian (empty)
    expect(dockerIndex).toBeLessThan(atlassianIndex); // Docker (has articles) before Atlassian (empty)
    expect(githubIndex).toBeLessThan(atlassianIndex); // GitHub (has articles) before Atlassian (empty)

    // Within the non-empty group, feeds should be in alphabetical order
    expect(awsIndex).toBeLessThan(dockerIndex); // AWS before Docker
    expect(dockerIndex).toBeLessThan(githubIndex); // Docker before GitHub

    // Within the empty group, feeds should be in alphabetical order
    expect(atlassianIndex).toBeLessThan(opensourceIndex); // Atlassian before Opensource
  });

  test("Empty feeds stay at bottom after filter changes", async ({ page }) => {
    // Enable all feeds first
    await page.evaluate(() => {
      localStorage.removeItem("enabledFeeds");
    });

    await page.reload();
    await page.waitForSelector(".feed-section", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Get positions of empty feeds
    const getEmptyFeedPositions = async () => {
      return await page.evaluate(() => {
        const sections = document.querySelectorAll(".feed-section");
        const feedData = [];

        sections.forEach((section, index) => {
          const h3 = section.querySelector("h2");
          const firstChild = h3?.childNodes[0];
          const name = firstChild ? firstChild.textContent.trim() : "";
          const countText =
            section.querySelector(".feed-count")?.textContent || "";
          const count = parseInt(countText.match(/(\d+)/)?.[1] || "0");

          feedData.push({ name, count, index });
        });

        return feedData;
      });
    };

    const feedData = await getEmptyFeedPositions();
    const emptyFeeds = feedData.filter((f) => f.count === 0);
    const nonEmptyFeeds = feedData.filter((f) => f.count > 0);

    // Verify empty feeds are after non-empty feeds
    if (emptyFeeds.length > 0 && nonEmptyFeeds.length > 0) {
      const maxNonEmptyIndex = Math.max(...nonEmptyFeeds.map((f) => f.index));
      const minEmptyIndex = Math.min(...emptyFeeds.map((f) => f.index));

      expect(minEmptyIndex).toBeGreaterThan(maxNonEmptyIndex);
    }
  });

  test("Feeds with data-hidden-by-filter are skipped during reordering", async ({
    page,
  }) => {
    // Disable some feeds
    await page.evaluate(() => {
      const enabledFeeds = ["AWS DevOps Blog", "Docker Blog"];
      localStorage.setItem("enabledFeeds", JSON.stringify(enabledFeeds));
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Trigger a reordering by changing timeframe
    await page.selectOption("#timeframe-select", "7days");
    await page.waitForTimeout(1000);

    // Check that hidden feeds still have data-hidden-by-filter
    const hiddenFeedsAfterReorder = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections).filter((s) =>
        s.hasAttribute("data-hidden-by-filter"),
      ).length;
    });

    // Should still have hidden feeds
    expect(hiddenFeedsAfterReorder).toBeGreaterThan(0);

    // Visible feeds should be in correct order
    const visibleFeeds = await page.evaluate(() => {
      const sections = document.querySelectorAll(".feed-section");
      return Array.from(sections)
        .filter((s) => !s.hasAttribute("data-hidden-by-filter"))
        .map((s) => {
          const h3 = s.querySelector("h2");
          const firstChild = h3?.childNodes[0];
          return firstChild ? firstChild.textContent.trim() : "";
        });
    });

    // Should only see enabled feeds
    expect(visibleFeeds).toContain("AWS DevOps Blog");
    expect(visibleFeeds).toContain("Docker Blog");
    expect(visibleFeeds.length).toBe(2);
  });
});
