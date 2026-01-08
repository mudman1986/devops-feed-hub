# Testing Documentation

This document describes the comprehensive testing strategy for the RSS Feed Collection project.

## Test Coverage Overview

### Unit Tests

#### JavaScript Tests (Jest)

- **Location**: `docs/script.test.js`
- **Coverage**: Mark as Read functionality, Theme toggle, Timeframe filtering
- **Run**: `npm test`
- **Coverage Report**: `npm run test:coverage`

**Tests Include:**

- Mark as Read functionality
  - Get/save read articles from localStorage
  - Toggle read status
  - Reset all read articles
- Theme toggle
  - Save/load theme preference
  - Toggle between light and dark modes
- Timeframe filtering
  - Save/load timeframe preference
  - Filter articles by time period

#### Python Tests (pytest)

- **Location**: `.github/actions/collect-rss-feeds/tests/`
- **Coverage**: RSS feed collection, HTML generation, feed ordering
- **Run**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`

**Test Files:**

- `test_collect_feeds.py` - Configuration validation
- `test_parse_rss_feed.py` - RSS feed parsing logic
- `test_generate_summary.py` - HTML/Markdown generation
- `test_feed_ordering.py` - Feed sorting and display logic

#### Shell Script Tests (BATS)

- **Location**: `.github/scripts/test_commit_github_pages.bats`
- **Coverage**: GitHub Pages commit script
- **Run**: `bats .github/scripts/test_commit_github_pages.bats`

### UI Tests (Playwright)

#### Multi-Device Testing

UI tests run on multiple device sizes to ensure responsive design:

- **Desktop**: 1920x1080, 1366x768
- **Tablet**: iPad (768x1024)
- **Mobile**: iPhone SE (375x667), iPhone 12 Pro (414x896)

#### Test Suites

**Layout Tests** (`tests/ui/layout.spec.js`)

- Header visibility and alignment
- Sidebar visibility (desktop vs mobile)
- Feed section spacing and structure
- Button alignment and positioning
- Footer placement
- Touch-friendly button sizes (mobile)
- Text readability across devices
- Visual consistency (no layout shifts)

**Functionality Tests** (`tests/ui/functionality.spec.js`)

- Theme toggle
  - Switch between light/dark modes
  - Icon and text updates
  - Persistence across reloads
- Timeframe filtering
  - Filter articles by 1 day, 7 days, 30 days
  - Update feed counts
  - Persistence across reloads
- Sidebar toggle (mobile)
  - Collapse/expand on button click
  - Close when clicking outside
- Mark as Read
  - Toggle read status
  - Reset all read articles
  - Persistence across reloads
- Navigation
  - Sidebar navigation links
  - Article links

#### Running UI Tests

```bash
# Run all UI tests
npm run test:ui

# Run in headed mode (see browser)
npm run test:ui:headed

# Debug mode (step through tests)
npm run test:ui:debug

# Run specific test file
npx playwright test tests/ui/layout.spec.js

# Run tests for specific device
npx playwright test --project="Mobile iPhone SE"
```

## CI/CD Integration

### Automated Testing Workflows

#### CI Tests (`ci-tests.yml`)

Runs on every push and pull request:

- Python unit tests
- JavaScript unit tests with coverage

#### UI Tests (`ui-tests.yml`)

Runs on every push to main and pull requests:

- Playwright tests across all device configurations
- Uploads test reports and screenshots on failure

### Test Reports

Test results are available as GitHub Actions artifacts:

- **Playwright Report**: Visual HTML report with test results
- **Screenshots**: Captured on test failures for debugging
- **Coverage Reports**: JavaScript code coverage metrics

## Writing New Tests

### JavaScript Unit Tests

Add tests to `docs/script.test.js`:

```javascript
describe("New Feature Tests", () => {
  test("should do something", () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Python Unit Tests

Create test files in `.github/actions/collect-rss-feeds/tests/`:

```python
import unittest

class TestNewFeature(unittest.TestCase):
    def test_something(self):
        # Test implementation
        self.assertEqual(result, expected)
```

### UI Tests

Add tests to `tests/ui/`:

```javascript
import { test, expect } from "@playwright/test";

test("should validate new UI feature", async ({ page }) => {
  await page.goto("/");
  const element = page.locator(".new-feature");
  await expect(element).toBeVisible();
});
```

## Test Coverage Goals

- **JavaScript**: Maintain >80% code coverage
- **Python**: Test all public functions and edge cases
- **UI**: Cover all interactive features across all device sizes

## Best Practices

1. **Write tests before fixing bugs** - Reproduce the bug in a test first
2. **Test edge cases** - Empty states, error conditions, boundary values
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive names** - Test names should describe what they verify
5. **Clean up after tests** - Reset state, clear localStorage, etc.
6. **Run tests locally** - Before pushing changes, verify all tests pass

## Troubleshooting

### UI Tests Failing Locally

If UI tests fail locally but pass in CI:

1. Ensure you have the latest Playwright browsers: `npx playwright install`
2. Check that http-server is installed: `npm ci`
3. Verify no other service is using port 8080

### Coverage Reports Not Generated

If coverage reports aren't generated:

1. Ensure all dependencies are installed: `npm ci`
2. Check Jest configuration in `package.json`
3. Run with verbose output: `npm run test:coverage -- --verbose`

## Future Enhancements

- [ ] Visual regression testing with screenshot comparison
- [ ] Performance testing (Lighthouse CI)
- [ ] Accessibility testing (axe-core)
- [ ] Cross-browser testing (Firefox, Safari, Edge)
- [ ] API mocking for more comprehensive feed testing
