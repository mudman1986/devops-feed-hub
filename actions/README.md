# Reusable GitHub Actions

This directory contains reusable composite actions that can be used across workflows or potentially moved to separate repositories in the future.

## Actions

### collect-rss-feeds

A composite action for collecting and parsing RSS/Atom feeds.

**Location**: `actions/collect-rss-feeds/`

**Usage**:
```yaml
- name: Collect RSS Feeds
  uses: ./actions/collect-rss-feeds
  with:
    config-path: ".github/rss-feeds.json"
    hours: "24"
    output-path: "rss-output.json"
```

**Documentation**: See [actions/collect-rss-feeds/README.md](collect-rss-feeds/README.md)

## Design Principles

- **Self-contained**: Each action should be self-contained with all dependencies included
- **Portable**: Actions are designed to be easily moved to separate repositories if needed
- **Well-documented**: Each action has its own README with usage examples
- **Tested**: Each action includes comprehensive test coverage
