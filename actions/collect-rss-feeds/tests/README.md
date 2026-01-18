# Tests for RSS Feed Collector Action

Unit tests for the RSS feed collector action components.

## Running Tests

Run all tests from the action directory:

```bash
cd actions/collect-rss-feeds
python3 -m pytest tests/ -v
```

Run specific test file:

```bash
python3 -m pytest tests/test_collect_feeds.py -v
python3 -m pytest tests/test_parse_rss_feed.py -v
```

Run with coverage:

```bash
python3 -m pytest tests/ -v --cov=. --cov-report=html
```

## Test Files

### test_collect_feeds.py

Tests for the core RSS feed collection logic.

### test_parse_rss_feed.py

Tests for RSS/Atom feed parsing functionality including:

- Date filtering
- Error handling
- Network issues
- Feed parsing errors

## Dependencies

Install test dependencies:

```bash
pip install pytest pytest-cov feedparser
```

## Note

Tests for HTML/RSS generation (`test_generate_summary.py`, `test_generate_rss.py`, `test_feed_ordering.py`)
have been moved to `.github/workflows/scripts/rss-processing/tests/` since those scripts are
workflow-specific and not part of the portable action.
