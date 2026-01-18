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

- **Location**: `actions/collect-rss-feeds/tests/` and `.github/workflows/scripts/rss-processing/tests/`
- **Run**: `python3 -m pytest actions/collect-rss-feeds/tests/ .github/workflows/scripts/rss-processing/tests/ -v`

Tests: RSS parsing, HTML generation, RSS feed generation, feed ordering, configuration validation

#### Shell Scripts (BATS)

- **Location**: `scripts/test/test_commit_github_pages.bats`
- **Run**: `bats scripts/test/test_commit_github_pages.bats`

## UI Tests (Playwright)

### ⚠️ Important: UI Test Prerequisites

**Playwright UI tests require generated HTML files to run.** The tests navigate to pages like `index.html`, `settings.html`, and `feed-*.html` which must exist in the `docs/` directory.

### Quick Setup (Recommended)

Use the provided script with existing test fixtures:

```bash
# Generate test HTML files from test fixtures
bash scripts/test/generate-test-data.sh

# Run UI tests
npm run test:ui
```

**Note**: This script uses test data from `.github/workflows/test-fixtures/rss-test-data.json` which is already in the repository.

### Manual Setup

If you need to generate test data manually:

```bash
# Generate HTML pages from existing test fixtures
python3 .github/workflows/scripts/rss-processing/generate_summary.py \
  --input .github/workflows/test-fixtures/rss-test-data.json \
  --output-dir docs

# Verify files were created
ls docs/*.html

# Run UI tests
npm run test:ui
```

### Running Specific UI Tests

```bash
# Run all UI tests
npm run test:ui

# Run specific test file
npx playwright test tests/ui/settings.spec.js

# Run specific project (viewport)
npx playwright test --project="Desktop Chrome 1920x1080"

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with specific reporter
npx playwright test --reporter=list
```

### CI/CD Integration

For automated testing in CI/CD, add this before running UI tests:

```yaml
- name: Generate test data for UI tests
  run: bash scripts/test/generate-test-data.sh

- name: Run UI tests
  run: npm run test:ui
```

### Troubleshooting

**Problem**: Tests fail with "data-theme is null" or "element not found"  
**Solution**: Generate HTML files first:

```bash
bash scripts/test/generate-test-data.sh
```

**Problem**: Tests timeout waiting for elements  
**Solution**: Ensure `docs/index.html` exists and contains valid HTML:

```bash
ls -la docs/index.html
```

**Problem**: "`http://localhost:8080` is already used"  
**Solution**: Kill the existing server:

```bash
kill $(lsof -ti:8080) 2>/dev/null || true
npm run test:ui
```

**Problem**: Strict mode violations in tests  
**Solution**: Tests have been updated with specific selectors (see commit 2eb018b)

### Test Data

The UI tests use test fixtures located in `.github/workflows/test-fixtures/`:

- `rss-test-data.json` - Complete test data with 3 feeds and 15 articles
- `rss-empty-data.json` - Empty test data for edge case testing

These fixtures are maintained in the repository and used by both the test suite and CI/CD workflows.

### Why is This Needed?

The UI tests use Playwright to test actual rendered HTML pages. Unlike unit tests that can mock everything, UI tests need real HTML files to navigate to and interact with. The `generate_summary.py` script creates these files from RSS feed data.

**In production**: The RSS feed workflow generates these files automatically  
**For testing**: We use test fixtures to generate the required HTML structure

This approach ensures:

- Tests run consistently with known data
- No external dependencies (no actual RSS feeds needed)
- Fast test execution
- Reproducible test results
