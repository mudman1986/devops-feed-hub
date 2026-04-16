# Testing Documentation

Comprehensive testing strategy for DevOps Feed Hub.

## Test Coverage

### Unit Tests

#### JavaScript (Jest)

- **Location**: `tests/js/script.test.js`
- **Run**: `npm test`
- **Coverage**: `npm run test:coverage`

Tests: Mark as Read, Theme toggle, Timeframe filtering

#### Python (pytest)

- **Location**: `tests/python/rss-processing/`
- **Run**: `python3 -m pytest tests/python/rss-processing/ -v`

Tests: RSS parsing, HTML generation, RSS feed generation, feed ordering, configuration validation

#### Shell Scripts (BATS)

- **Location**: `tests/shell/test_commit_github_pages.bats`
- **Run**: `bats tests/shell/test_commit_github_pages.bats`

## UI Tests (Playwright)

### ⚠️ Important: UI Test Prerequisites

**Playwright UI tests require generated HTML files to run.** The tests navigate to pages like `index.html`, `settings.html`, and `feed-*.html` which must exist in the `site/` directory.

### Quick Setup (Recommended)

Use the provided script with existing test fixtures:

```bash
# Generate test HTML files from test fixtures
bash scripts/generate-test-data.sh

# Run UI tests
npm run test:ui
```

**Note**: This script uses test data from `tests/fixtures/ui-test-data.json` which is already in the repository.

### Manual Setup

If you need to generate test data manually:

```bash
# Generate HTML pages from existing test fixtures
python3 scripts/workflows/rss-processing/generate_summary.py \
  --input tests/fixtures/ui-test-data.json \
  --output-dir site

# Verify files were created
ls site/*.html

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
  run: bash scripts/generate-test-data.sh

- name: Run UI tests
  run: npm run test:ui
```

#### CI Test Workflow Log Visibility

The UI test workflow uses test sharding to parallelize execution across 10 shards. To improve troubleshooting:

**Features**:

- **GitHub Reporter**: Adds GitHub annotations for failed tests directly in the PR
- **List Reporter**: Shows detailed test progress in CI logs with test names
- **JSON Reporter**: Generates machine-readable results for summaries
- **Per-Shard Summaries**: Each shard job creates a summary showing:
  - Which test files were executed in that shard
  - Total test count for the shard
  - Pass/fail statistics
- **Consolidated Summary**: A final summary job shows results across all shards

**Finding Failures**:

1. Check the "Test Summary" job at the bottom of the workflow run for an overview
2. Look at individual shard job summaries to find which shard contains the failing test
3. Open the specific shard's logs to see detailed output for the failing test
4. GitHub annotations will point you directly to the failing test in the PR

**Test File Organization by Shard**:
Each shard processes a subset of test files. The summary shows exactly which files are in each shard, making it easy to identify where a specific test is running.

### Troubleshooting

**Problem**: Tests fail with "data-theme is null" or "element not found"  
**Solution**: Generate HTML files first:

```bash
bash scripts/generate-test-data.sh
```

**Problem**: Tests timeout waiting for elements  
**Solution**: Ensure `site/index.html` exists and contains valid HTML:

```bash
ls -la site/index.html
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

The UI tests use test fixtures located in `tests/fixtures/`:

- `ui-test-data.json` - Complete test data with 9 feeds and 25 articles

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
