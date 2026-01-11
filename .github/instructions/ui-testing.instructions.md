# UI Testing with Playwright

Instructions for running and maintaining Playwright UI tests.

## Running UI Tests

### Prerequisites

**CRITICAL**: UI tests require generated HTML files. Always run the setup script first:

```bash
# Generate test HTML from existing test fixtures
bash .github/scripts/generate-test-data.sh

# Then run UI tests
npm run test:ui
```

### What the Script Does

The `generate-test-data.sh` script:

1. Uses test data from `.github/workflows/test-fixtures/rss-test-data.json`
2. Generates HTML files: `index.html`, `summary.html`, `feed-*.html`
3. Places them in `docs/` directory for Playwright to access

### Running Tests

```bash
# Full UI test suite
npm run test:ui

# Specific test file
npx playwright test tests/ui/settings.spec.js

# Single test by line number
npx playwright test tests/ui/functionality.spec.js:12

# Specific viewport/project
npx playwright test --project="Desktop Chrome 1920x1080"

# Debug mode (opens browser)
npx playwright test --debug
```

## Test Data

**Location**: `.github/workflows/test-fixtures/rss-test-data.json`

This file contains:

- 3 test feeds (Test Feed A, B, C)
- 15 test articles
- Complete metadata structure

**DO NOT create custom test data** - use the existing fixture.

## Troubleshooting

### Error: "data-theme is null"

**Cause**: Missing `index.html`  
**Fix**: Run `bash .github/scripts/generate-test-data.sh`

### Error: "`http://localhost:8080` is already used"

**Cause**: Previous test server still running  
**Fix**: `kill $(lsof -ti:8080) 2>/dev/null || true`

### Error: "Strict mode violation"

**Cause**: Selector matches multiple elements  
**Fix**: Use specific selectors like `.settings-sidebar .menu-item:has-text("Text")`

## Writing New UI Tests

### Settings Page Tests

Use specific selectors to avoid strict mode violations:

```javascript
// ❌ BAD - matches multiple elements
await page.locator('text="Appearance"').click();

// ✅ GOOD - specific to sidebar menu
await page
  .locator('.settings-sidebar .menu-item:has-text("Appearance")')
  .click();
```

### Required Test Setup

Always include beforeEach to clear state:

```javascript
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});
```

### Test Data Dependencies

UI tests depend on generated HTML containing:

- Valid HTML structure with `data-theme` attribute
- Navigation links in `.nav-link` elements
- Feed sections with proper IDs
- Theme toggle, timeframe selector, etc.

## Key Files

- **Test fixtures**: `.github/workflows/test-fixtures/rss-test-data.json`
- **Setup script**: `.github/scripts/generate-test-data.sh`
- **Test files**: `tests/ui/*.spec.js`
- **Config**: `playwright.config.js`

## CI/CD Integration

In workflow files, always generate test data before running tests:

```yaml
- name: Generate test HTML for UI tests
  run: bash .github/scripts/generate-test-data.sh

- name: Run Playwright tests
  run: npm run test:ui
```
