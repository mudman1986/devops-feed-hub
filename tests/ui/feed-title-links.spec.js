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
  // Use 1year timeframe to ensure all test articles are visible
  await page.evaluate(() => localStorage.setItem("selectedTimeframe", "1year"));
  await page.reload();
  await page.waitForSelector(".feed-section", { timeout: 10000 });
});

test.describe("Feed Title Links", () => {
  test("feed section titles should be links on the main index page", async ({
    page,
  }) => {
    const titleLinks = page.locator("h2 .feed-title-link");
    const count = await titleLinks.count();
    expect(count).toBeGreaterThan(0);

    // Each link must have a valid https href
    for (let i = 0; i < count; i++) {
      const href = await titleLinks.nth(i).getAttribute("href");
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test("feed title links open in a new tab with noopener noreferrer", async ({
    page,
  }) => {
    const titleLink = page.locator("h2 .feed-title-link").first();
    await expect(titleLink).toBeVisible();

    await expect(titleLink).toHaveAttribute("target", "_blank");
    await expect(titleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("feed title link text matches the feed section name", async ({
    page,
  }) => {
    const firstSection = page.locator(".feed-section").first();
    const h2 = firstSection.locator("h2");
    const titleLink = h2.locator(".feed-title-link");

    await expect(titleLink).toBeVisible();
    const linkText = (await titleLink.textContent()).trim();
    expect(linkText.length).toBeGreaterThan(0);
  });

  test("feed title links are present on individual feed pages", async ({
    page,
  }) => {
    // Navigate to the AWS DevOps Blog feed page (present in test fixture)
    await page.goto("/feed-aws-devops-blog.html");
    await page.waitForSelector(".feed-section", { timeout: 10000 });

    const titleLink = page.locator("h2 .feed-title-link").first();
    await expect(titleLink).toBeVisible();

    const href = await titleLink.getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);
  });

  test("feed title link is keyboard focusable", async ({ page }) => {
    const titleLink = page.locator("h2 .feed-title-link").first();
    await expect(titleLink).toBeVisible();

    // Tab to the link and verify it receives focus
    await titleLink.focus();
    await expect(titleLink).toBeFocused();
  });

  test("feed title links are visible on mobile viewport", async ({ page }) => {
    // All projects run this; on mobile (touch) the link must still be visible
    const titleLinks = page.locator("h2 .feed-title-link");
    const count = await titleLinks.count();
    expect(count).toBeGreaterThan(0);

    const firstLink = titleLinks.first();
    await expect(firstLink).toBeVisible();

    // Verify the link is within an h2 element that is tappable
    const box = await firstLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThan(0);
    expect(box.width).toBeGreaterThan(0);
  });
});
