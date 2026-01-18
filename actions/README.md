# Reusable GitHub Actions

This directory contains reusable composite actions that are designed to be portable and
potentially moved to separate repositories in the future.

## Actions

### collect-rss-feeds

A lightweight, portable composite action for collecting RSS/Atom feeds.

**Location**: `actions/collect-rss-feeds/`

**What it does**:

- Collects RSS/Atom feed data using `feedparser`
- Outputs structured JSON with article metadata
- Generates GitHub workflow Markdown summaries

**What it does NOT do**:

- HTML page generation (handled by workflow scripts)
- RSS feed generation (handled by workflow scripts)

This separation keeps the action focused and portable for extraction.

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

- **Self-contained**: Each action includes only what it needs to perform its core function
- **Portable**: Actions are designed to be easily extracted to separate repositories
- **Well-documented**: Each action has its own readme with usage examples
- **Tested**: Each action includes comprehensive test coverage
- **Focused**: Actions do one thing well; workflow-specific logic stays in workflow scripts

## Separation from Workflow Scripts

Presentation and formatting logic (HTML, RSS generation) is intentionally kept in
`.github/workflows/scripts/rss-processing/` rather than in the action. This allows:

- The action to be extracted without breaking workflows
- Project-specific formatting to evolve independently
- Clear separation between data collection and presentation
