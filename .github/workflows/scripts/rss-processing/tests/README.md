# Tests for RSS Processing Scripts

Unit tests for workflow-specific RSS processing scripts.

## Test Files

### test_generate_summary.py
Tests for HTML and markdown generation including:
- Markdown summary generation
- HTML page generation (index, feed pages, summary page)
- Content formatting and escaping
- Navigation generation
- Edge cases (empty feeds, long titles, etc.)

### test_generate_rss.py
Tests for RSS 2.0 feed generation including:
- Master feed with all articles
- Individual feed-specific RSS files
- RFC 822 date formatting
- XML structure validation

### test_feed_ordering.py
Tests for article ordering and sorting logic.

## Running Tests

```bash
# From repository root
python3 -m pytest .github/workflows/scripts/rss-processing/tests/ -v

# Run specific test
python3 -m pytest .github/workflows/scripts/rss-processing/tests/test_generate_summary.py -v

# With coverage
python3 -m pytest .github/workflows/scripts/rss-processing/tests/ -v \
  --cov=.github/workflows/scripts/rss-processing \
  --cov-report=html
```

## Dependencies

```bash
pip install pytest pytest-cov
```

No external dependencies required - scripts use only Python standard library.
