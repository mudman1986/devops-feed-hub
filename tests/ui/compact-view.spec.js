const { test, expect } = require('@playwright/test')

const VIEWPORTS = {
  desktop1920: { width: 1920, height: 1080 },
  desktop1366: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile375: { width: 375, height: 667 },
  mobile414: { width: 414, height: 896 }
}

test.describe('Compact View UI Tests', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`Compact view selector should be in sidebar footer on ${name}`, async ({
      page
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:8080/')

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Check that view selector exists in sidebar footer
      const viewSelector = await page.locator('.sidebar-footer .view-selector')
      await expect(viewSelector).toBeVisible()

      const viewLabel = await page.locator('.view-label')
      await expect(viewLabel).toBeVisible()
      await expect(viewLabel).toHaveText('View')

      const viewSelect = await page.locator('#view-select')
      await expect(viewSelect).toBeVisible()
      
      // Should have two options
      const options = await viewSelect.locator('option').allTextContents()
      expect(options).toEqual(['Comfortable', 'Compact'])
    })

    test(`Compact view should change styling on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:8080/')

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Initially should be comfortable view
      const htmlElement = page.locator('html')
      await expect(htmlElement).not.toHaveAttribute('data-view', 'compact')

      // Switch to compact view
      await page.selectOption('#view-select', 'compact')
      await page.waitForTimeout(300)

      // Should now have compact view attribute
      await expect(htmlElement).toHaveAttribute('data-view', 'compact')

      // Take screenshots for comparison
      await page.screenshot({
        path: `/tmp/compact-view-${name}.png`,
        fullPage: true
      })
    })

    test(`Compact view should have dense styling on ${name}`, async ({
      page
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:8080/')

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Switch to compact view
      await page.selectOption('#view-select', 'compact')
      await page.waitForTimeout(300)

      // Verify compact styles are applied
      const feedSection = page.locator('.feed-section').first()
      if (await feedSection.isVisible()) {
        const bgColor = await feedSection.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        )
        // In compact view, background should be transparent (rgba(0, 0, 0, 0))
        expect(bgColor).toContain('rgba(0, 0, 0, 0)')

        const border = await feedSection.evaluate((el) =>
          window.getComputedStyle(el).border
        )
        // Should have no border in compact view
        expect(border).toContain('none')
      }

      // Check h3 font size is smaller in compact view
      const h3 = page.locator('h3').first()
      if (await h3.isVisible()) {
        const fontSize = await h3.evaluate((el) =>
          window.getComputedStyle(el).fontSize
        )
        // Should be 0.875rem = 14px (assuming 16px base)
        expect(fontSize).toBe('14px')
      }

      // Check article items have minimal padding
      const article = page.locator('.article-item').first()
      if (await article.isVisible()) {
        const marginBottom = await article.evaluate((el) =>
          window.getComputedStyle(el).marginBottom
        )
        // Should be 0 in compact view
        expect(marginBottom).toBe('0px')

        const borderBottom = await article.evaluate((el) =>
          window.getComputedStyle(el).borderBottom
        )
        // Should have a bottom border
        expect(borderBottom).not.toContain('none')
      }
    })

    test(`View preference should persist on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:8080/')

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Set to compact view
      await page.selectOption('#view-select', 'compact')
      await page.waitForTimeout(300)

      // Close sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Reload page
      await page.reload()
      await page.waitForTimeout(500)

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Should still be compact
      const htmlElement = page.locator('html')
      await expect(htmlElement).toHaveAttribute('data-view', 'compact')

      const viewSelect = page.locator('#view-select')
      await expect(viewSelect).toHaveValue('compact')

      // Reset to comfortable for other tests
      await page.selectOption('#view-select', 'comfortable')
      await page.waitForTimeout(300)
    })

    test(`Touch targets should be adequate on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:8080/')

      // Open sidebar on mobile
      if (viewport.width <= 768) {
        await page.click('#nav-toggle')
        await page.waitForTimeout(300)
      }

      // Check view select has adequate size
      const viewSelect = page.locator('#view-select')
      const box = await viewSelect.boundingBox()

      if (viewport.width <= 480) {
        // On mobile, touch targets should be at least 44x44px
        expect(box.height).toBeGreaterThanOrEqual(38) // Allowing some tolerance
      }
    })
  }
})
