import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Desktop - List View - Light Theme
  let page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-view', 'list');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'before-desktop-list-light.png', fullPage: true });
  console.log('✓ Desktop list view (light) screenshot taken');
  
  // Desktop - List View - Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'before-desktop-list-dark.png', fullPage: true });
  console.log('✓ Desktop list view (dark) screenshot taken');
  
  // Mobile - List View - Light Theme
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'before-mobile-list-light.png', fullPage: true });
  console.log('✓ Mobile list view (light) screenshot taken');
  
  // Mobile - List View - Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'before-mobile-list-dark.png', fullPage: true });
  console.log('✓ Mobile list view (dark) screenshot taken');
  
  // Tablet - List View
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'before-tablet-list-light.png', fullPage: true });
  console.log('✓ Tablet list view (light) screenshot taken');
  
  await browser.close();
  console.log('\n✓ All before screenshots captured');
})();
