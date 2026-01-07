# RSS Feed Collector - Workflow Documentation

A modular GitHub Actions workflow for collecting RSS/Atom feeds.

## Overview

This implementation uses a **composite action** approach to provide a clean, reusable, and DRY (Don't Repeat Yourself) solution for RSS feed collection.

### Architecture

```
.github/
├── actions/
│   └── collect-rss-feeds/          # Reusable composite action
│       ├── action.yml               # Action definition
│       ├── collect_feeds.py         # Python script using feedparser
│       └── README.md                # Action documentation
├── workflows/
│   └── rss-feed-collector.yml       # Main workflow
└── rss-feeds.json                   # Feed configuration
```

## Features

- ✅ **Modular Design**: Composite action can be reused in multiple workflows
- ✅ **DRY Principle**: Single source of truth for RSS collection logic
- ✅ **Modern Library**: Uses `feedparser` for robust RSS/Atom parsing
- ✅ **JSON Output**: Structured data for easy integration
- ✅ **GitHub Summary**: Formatted results displayed in workflow summary
- ✅ **Artifact Storage**: Results saved for 30 days
- ✅ **Smart Scheduling**: Fetches articles since last successful run

## Quick Start

### 1. Configure RSS Feeds

Edit `.github/rss-feeds.json`:

```json
{
  "feeds": [
    {
      "name": "Microsoft DevOps Blog",
      "url": "https://devblogs.microsoft.com/devops/feed/"
    },
    {
      "name": "GitHub Blog",
      "url": "https://github.com/blog/all.atom"
    }
  ]
}
```

### 2. Run the Workflow

The workflow runs automatically:

- **Schedule**: Monday-Friday at 9 AM UTC
- **Trigger**: On every push to main branch
- **Manual**: Via workflow_dispatch with custom hours parameter

### 3. View Results

Results are available in:

1. **Workflow Summary**: Formatted tables with articles
2. **Artifacts**: Download `rss-feeds-output.json` for 30 days
3. **Logs**: Detailed collection progress

## Using the Composite Action

The composite action can be reused in any workflow:

```yaml
- name: Collect RSS Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds
  with:
    config-path: ".github/rss-feeds.json"
    hours: 24
    output-path: "feeds.json"

- name: Process results
  run: |
    echo "Found ${{ steps.collect.outputs.total-articles }} articles"
    # Use feeds.json for further processing
```

## Future Extensions

The modular design makes it easy to add notification integrations:

### Email Notifications

```yaml
- name: Collect Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds

- name: Send Email
  run: |
    # Read ${{ steps.collect.outputs.output-file }}
    # Format and send email
```

### Slack Notifications

```yaml
- name: Collect Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds

- name: Send to Slack
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
  run: |
    # Read JSON output
    # Post to Slack
```

### Microsoft Teams

```yaml
- name: Collect Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds

- name: Send to Teams
  env:
    TEAMS_WEBHOOK: ${{ secrets.TEAMS_WEBHOOK }}
  run: |
    # Read JSON output
    # Post to Teams channel
```

## Configuration

### RSS Feeds

Edit `.github/rss-feeds.json` to add or remove feeds.

### Time Window

The workflow automatically calculates the time window:

- If last run was today: fetch last 24 hours
- Otherwise: fetch since last successful run (max 7 days)
- Manual runs: specify custom hours via workflow_dispatch

## Output Format

The action generates a structured JSON file with feed data, articles, and summary statistics.

## Library Choice

**feedparser** was chosen because:

- Most popular Python RSS/Atom parser (18K+ stars on GitHub)
- Handles both RSS 2.0 and Atom feeds
- Robust error handling
- Normalizes different feed formats
- Active maintenance and wide adoption
- Pure Python, no external dependencies

## Advantages

1. **Reusability**: The composite action can be used in multiple workflows
2. **Maintainability**: Single location for RSS collection logic
3. **Extensibility**: Easy to add new notification methods
4. **Modern**: Uses industry-standard `feedparser` library
5. **Clean**: Separation of concerns (collection vs. notification)
6. **Testable**: Action can be tested independently
