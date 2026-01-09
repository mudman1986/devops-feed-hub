---
applyTo: ".github/actions/**/*.py"
---

# RSS Feed Action Python Development

## Standards

- Follow PEP 8 with type hints and docstrings
- Use `feedparser` library for RSS/Atom parsing
- Handle exceptions with specific error messages
- Use context managers for file operations

## Testing

- Add unit tests for new functions in `.github/actions/collect-rss-feeds/tests/`
- Test edge cases: empty feeds, malformed XML, network errors
- Mock external HTTP requests
- Run: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`

## Output

- Generate structured JSON with ISO 8601 timestamps
- Include feeds, articles, and summary statistics
- List failed feeds separately for debugging
