# Testing Documentation

Comprehensive testing strategy for DevOps Feed Hub.

## Test Coverage

### Unit Tests

#### JavaScript (Jest)

- **Location**: `docs/script.test.js`
- **Run**: `npm test`
- **Coverage**: `npm run test:coverage`

Tests: Mark as Read, Theme toggle, Timeframe filtering

#### Python (pytest)

- **Location**: `.github/actions/collect-rss-feeds/tests/`
- **Run**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`

Tests: RSS parsing, HTML generation, feed ordering, configuration validation

#### Shell Scripts (BATS)

- **Location**: `.github/scripts/test_commit_github_pages.bats`
- **Run**: `bats .github/scripts/test_commit_github_pages.bats`

### UI Tests (Playwright)

Multi-device testing on Desktop (1920x1080, 1366x768), Tablet (768x1024), Mobile (375x667, 414x896)

**Test Suites:**

- `tests/ui/layout.spec.js` - Header, sidebar, spacing, alignment, touch targets
- `tests/ui/functionality.spec.js` - Theme toggle, filtering, mark as read, navigation

**Running:**

```bash
npm run test:ui              # All tests
npm run test:ui:headed       # See browser
npm run test:ui:debug        # Step through
```

## CI/CD Integration

- **CI Tests** (`ci-tests.yml`): Python and JavaScript tests on every push/PR
- **UI Tests** (`ui-tests.yml`): Playwright tests on all devices
- **Reports**: Available as GitHub Actions artifacts

## Writing Tests

### JavaScript

```javascript
describe("Feature", () => {
  test("should work", () => {
    expect(result).toBe(expected);
  });
});
```

### Python

```python
class TestFeature(unittest.TestCase):
    def test_something(self):
        self.assertEqual(result, expected)
```

### UI Tests

```javascript
test("validates feature", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".feature")).toBeVisible();
});
```

## Best Practices

1. Write tests before fixing bugs
2. Test edge cases and error conditions
3. Keep tests isolated and independent
4. Use descriptive test names
5. Clean up after tests
6. Run tests locally before pushing

## Coverage Goals

- **JavaScript**: >80% code coverage
- **Python**: Test all public functions and edge cases
- **UI**: Cover all features across all device sizes
