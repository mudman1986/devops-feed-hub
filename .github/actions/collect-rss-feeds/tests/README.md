# Tests for RSS Feed Collection Action

This directory contains unit tests for the RSS feed collection action.

## Running Tests

To run all tests:

```bash
cd .github/actions/collect-rss-feeds/tests
python3 -m unittest discover -v
```

To run a specific test file:

```bash
python3 -m unittest test_generate_summary
python3 -m unittest test_collect_feeds
```

## Test Coverage

### test_generate_summary.py
Tests for the `generate_summary.py` module:
- Markdown summary generation
- HTML page generation
- Content formatting
- Edge cases (empty feeds, long titles, etc.)
- File I/O operations

### test_collect_feeds.py
Tests for the `collect_feeds.py` module:
- RSS feed parsing
- Date filtering
- Error handling
- Network issues
- Feed parsing errors

## Dependencies

Tests require the same dependencies as the main scripts:
- feedparser
- Python 3.11+

Install test dependencies:
```bash
pip install feedparser
```
