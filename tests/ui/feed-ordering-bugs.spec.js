import { expect, test } from "@playwright/test";

/**
 * Feed Ordering Bug Tests
 * 
 * These tests demonstrate the feed ordering bugs that need to be fixed:
 * 
 * Bug 1: Feeds with zero articles appear on top initially (should be at bottom)
 * Bug 2: When "reset read articles" is clicked, empty feeds move back to top
 * Bug 3: When all articles in a feed are marked as read, feed moves to bottom (CORRECT)
 * Bug 4: When timeframe is changed after marking all as read, read feeds move back to original position (INCORRECT)
 */

test.beforeEach(async ({ page }) => {
  // Navigate to page and clear localStorage
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.evaluate(() => localStorage.clear());
});

test.describe("Feed Ordering Bugs - Empty Feeds", () => {
  test("Bug 1: Empty feeds should be at bottom, not top", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    // Get all feed sections
    const feedSections = await page.locator(".feed-section").all();
    
    // For each feed, check if it has articles
    const feedData = [];
    for (const section of feedSections) {
      const feedName = await section.locator("h3").textContent();
      const countText = await section.locator(".feed-count").textContent();
      const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
      
      feedData.push({
        name: feedName.trim(),
        count: articleCount,
        index: feedData.length
      });
    }

    console.log("Initial feed order:", feedData);

    // Find first empty feed and first non-empty feed
    const firstEmptyFeed = feedData.find(f => f.count === 0);
    const firstNonEmptyFeed = feedData.find(f => f.count > 0);

    if (firstEmptyFeed && firstNonEmptyFeed) {
      // BUG: Empty feed might appear before non-empty feed
      // EXPECTED: All non-empty feeds should appear before empty feeds
      console.log(`First empty feed "${firstEmptyFeed.name}" at index ${firstEmptyFeed.index}`);
      console.log(`First non-empty feed "${firstNonEmptyFeed.name}" at index ${firstNonEmptyFeed.index}`);
      
      // This test will FAIL initially, showing the bug
      expect(firstEmptyFeed.index).toBeGreaterThan(firstNonEmptyFeed.index);
    }
  });

  test("Bug 2: After reset read articles, empty feeds should stay at bottom", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    // Mark some articles as read first
    const readIndicators = await page.locator(".read-indicator").all();
    if (readIndicators.length > 0) {
      // Mark first 3 articles as read
      for (let i = 0; i < Math.min(3, readIndicators.length); i++) {
        await readIndicators[i].click();
        await page.waitForTimeout(100);
      }
    }

    // Wait for reordering to complete
    await page.waitForTimeout(500);

    // Now reset read articles
    page.on('dialog', dialog => dialog.accept());
    await page.locator("#reset-read-button").click();
    await page.waitForTimeout(500);

    // Get feed order after reset
    const feedSections = await page.locator(".feed-section").all();
    const feedData = [];
    for (const section of feedSections) {
      const feedName = await section.locator("h3").textContent();
      const countText = await section.locator(".feed-count").textContent();
      const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
      
      feedData.push({
        name: feedName.trim(),
        count: articleCount,
        index: feedData.length
      });
    }

    console.log("Feed order after reset:", feedData);

    // Check that empty feeds are still at bottom
    const emptyFeeds = feedData.filter(f => f.count === 0);
    const nonEmptyFeeds = feedData.filter(f => f.count > 0);

    if (emptyFeeds.length > 0 && nonEmptyFeeds.length > 0) {
      const maxNonEmptyIndex = Math.max(...nonEmptyFeeds.map(f => f.index));
      const minEmptyIndex = Math.min(...emptyFeeds.map(f => f.index));

      console.log(`Max non-empty feed index: ${maxNonEmptyIndex}`);
      console.log(`Min empty feed index: ${minEmptyIndex}`);

      // BUG: After reset, empty feeds might move back to top
      // EXPECTED: Empty feeds should remain at bottom
      // This test will FAIL initially, showing the bug
      expect(minEmptyIndex).toBeGreaterThan(maxNonEmptyIndex);
    }
  });
});

test.describe("Feed Ordering Bugs - All Read Feeds", () => {
  test("Bug 3: When all articles marked as read, feed moves to bottom (CORRECT BEHAVIOR)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    // Find a feed with articles
    const feedSections = await page.locator(".feed-section").all();
    let targetFeedName = null;
    let targetFeedInitialIndex = -1;

    for (let i = 0; i < feedSections.length; i++) {
      const countText = await feedSections[i].locator(".feed-count").textContent();
      const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
      
      if (articleCount > 0 && articleCount <= 5) {
        targetFeedName = await feedSections[i].locator("h3").textContent();
        targetFeedInitialIndex = i;
        break;
      }
    }

    if (targetFeedName) {
      console.log(`Target feed: "${targetFeedName}" at initial index ${targetFeedInitialIndex}`);

      // Mark all articles as read in this feed
      const targetFeed = feedSections[targetFeedInitialIndex];
      const readIndicators = await targetFeed.locator(".read-indicator").all();
      
      for (const indicator of readIndicators) {
        await indicator.click();
        await page.waitForTimeout(100);
      }

      await page.waitForTimeout(500);

      // Get new position of the feed
      const updatedFeedSections = await page.locator(".feed-section").all();
      let newIndex = -1;
      for (let i = 0; i < updatedFeedSections.length; i++) {
        const name = await updatedFeedSections[i].locator("h3").textContent();
        if (name === targetFeedName) {
          newIndex = i;
          break;
        }
      }

      console.log(`After marking all as read, feed moved to index ${newIndex}`);

      // This should PASS - feed should move down when all articles are read
      expect(newIndex).toBeGreaterThan(targetFeedInitialIndex);
    } else {
      console.log("No suitable feed found for test");
    }
  });

  test("Bug 4: After changing timeframe, all-read feeds should stay at bottom", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    // Find a feed with a small number of articles
    const feedSections = await page.locator(".feed-section").all();
    let targetFeedName = null;

    for (const section of feedSections) {
      const countText = await section.locator(".feed-count").textContent();
      const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
      
      if (articleCount > 0 && articleCount <= 5) {
        targetFeedName = await section.locator("h3").textContent();
        break;
      }
    }

    if (targetFeedName) {
      console.log(`Target feed: "${targetFeedName}"`);

      // Mark all articles as read in this feed
      const targetFeedSections = await page.locator(".feed-section").all();
      for (const section of targetFeedSections) {
        const name = await section.locator("h3").textContent();
        if (name === targetFeedName) {
          const readIndicators = await section.locator(".read-indicator").all();
          for (const indicator of readIndicators) {
            await indicator.click();
            await page.waitForTimeout(100);
          }
          break;
        }
      }

      await page.waitForTimeout(500);

      // Get position after marking as read
      let positionAfterMarkingRead = -1;
      const sectionsAfterRead = await page.locator(".feed-section").all();
      for (let i = 0; i < sectionsAfterRead.length; i++) {
        const name = await sectionsAfterRead[i].locator("h3").textContent();
        if (name === targetFeedName) {
          positionAfterMarkingRead = i;
          break;
        }
      }

      console.log(`Position after marking as read: ${positionAfterMarkingRead}`);

      // Now change timeframe
      await page.locator("#timeframe-select").selectOption("7days");
      await page.waitForTimeout(500);

      // Get position after changing timeframe
      let positionAfterTimeframeChange = -1;
      const sectionsAfterTimeframe = await page.locator(".feed-section").all();
      for (let i = 0; i < sectionsAfterTimeframe.length; i++) {
        const name = await sectionsAfterTimeframe[i].locator("h3").textContent();
        if (name === targetFeedName) {
          positionAfterTimeframeChange = i;
          break;
        }
      }

      console.log(`Position after timeframe change: ${positionAfterTimeframeChange}`);

      // Get all feed data after timeframe change
      const finalFeedData = [];
      for (const section of sectionsAfterTimeframe) {
        const name = await section.locator("h3").textContent();
        const countText = await section.locator(".feed-count").textContent();
        const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
        
        // Check if has unread articles
        const readIndicators = await section.locator(".read-indicator:not(.active)").count();
        
        finalFeedData.push({
          name: name.trim(),
          count: articleCount,
          unreadCount: readIndicators,
          index: finalFeedData.length
        });
      }

      console.log("Final feed order:", finalFeedData);

      // Find feeds with unread articles
      const feedsWithUnread = finalFeedData.filter(f => f.unreadCount > 0);
      const targetFeedData = finalFeedData.find(f => f.name === targetFeedName);

      if (feedsWithUnread.length > 0 && targetFeedData) {
        const maxUnreadIndex = Math.max(...feedsWithUnread.map(f => f.index));
        
        console.log(`Max index of feeds with unread: ${maxUnreadIndex}`);
        console.log(`Target feed (all read) index: ${targetFeedData.index}`);

        // BUG: After timeframe change, all-read feed might move back to original position
        // EXPECTED: All-read feed should stay below feeds with unread articles
        // This test will FAIL initially, showing the bug
        expect(targetFeedData.index).toBeGreaterThan(maxUnreadIndex);
      }
    } else {
      console.log("No suitable feed found for test");
    }
  });
});

test.describe("Feed Ordering Expected Behavior", () => {
  test("Feeds should be ordered: unread > all-read > empty", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    // Mark some articles as read to create different feed states
    const readIndicators = await page.locator(".read-indicator").all();
    if (readIndicators.length >= 3) {
      for (let i = 0; i < 3; i++) {
        await readIndicators[i].click();
        await page.waitForTimeout(100);
      }
    }

    await page.waitForTimeout(500);

    // Categorize all feeds
    const feedSections = await page.locator(".feed-section").all();
    const feedCategories = {
      withUnread: [],
      allRead: [],
      empty: []
    };

    for (let i = 0; i < feedSections.length; i++) {
      const section = feedSections[i];
      const name = await section.locator("h3").textContent();
      const countText = await section.locator(".feed-count").textContent();
      const articleCount = parseInt(countText.match(/(\d+)/)?.[1] || "0");
      const unreadCount = await section.locator(".read-indicator:not(.active)").count();

      const feedInfo = { name: name.trim(), index: i, count: articleCount, unread: unreadCount };

      if (articleCount === 0) {
        feedCategories.empty.push(feedInfo);
      } else if (unreadCount > 0) {
        feedCategories.withUnread.push(feedInfo);
      } else {
        feedCategories.allRead.push(feedInfo);
      }
    }

    console.log("Feed categories:", {
      withUnread: feedCategories.withUnread.map(f => `${f.name} (${f.index})`),
      allRead: feedCategories.allRead.map(f => `${f.name} (${f.index})`),
      empty: feedCategories.empty.map(f => `${f.name} (${f.index})`)
    });

    // Expected order: all withUnread indices < all allRead indices < all empty indices
    if (feedCategories.withUnread.length > 0 && feedCategories.allRead.length > 0) {
      const maxUnreadIndex = Math.max(...feedCategories.withUnread.map(f => f.index));
      const minAllReadIndex = Math.min(...feedCategories.allRead.map(f => f.index));
      
      expect(maxUnreadIndex).toBeLessThan(minAllReadIndex);
    }

    if (feedCategories.allRead.length > 0 && feedCategories.empty.length > 0) {
      const maxAllReadIndex = Math.max(...feedCategories.allRead.map(f => f.index));
      const minEmptyIndex = Math.min(...feedCategories.empty.map(f => f.index));
      
      expect(maxAllReadIndex).toBeLessThan(minEmptyIndex);
    }

    if (feedCategories.withUnread.length > 0 && feedCategories.empty.length > 0) {
      const maxUnreadIndex = Math.max(...feedCategories.withUnread.map(f => f.index));
      const minEmptyIndex = Math.min(...feedCategories.empty.map(f => f.index));
      
      expect(maxUnreadIndex).toBeLessThan(minEmptyIndex);
    }
  });
});
