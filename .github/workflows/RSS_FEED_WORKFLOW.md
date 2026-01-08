# RSS Feed Workflow - Overview

Modular GitHub Actions workflow for collecting RSS/Atom feeds using a composite action approach.

## Architecture

```text
.github/
├── actions/collect-rss-feeds/   # Reusable composite action
├── workflows/rss-github-page.yml # Main workflow
└── rss-feeds.json                # Feed configuration
```

## Features

- Composite action for reusability across workflows
- Modern `feedparser` library for RSS/Atom parsing
- Structured JSON output for easy integration
- Formatted workflow summaries
- Smart scheduling (fetches since last run)

## Workflow Schedule

- **Automatic**: Monday-Friday at 9 AM UTC
- **On push**: To main branch
- **Manual**: workflow_dispatch with custom hours parameter

## Configuration

Edit `.github/rss-feeds.json` to add/modify feeds:

```json
{
  "feeds": [
    {
      "name": "Microsoft DevOps Blog",
      "url": "https://devblogs.microsoft.com/devops/feed/"
    }
  ]
}
```

## Results

Available in:
1. **Workflow Summary**: Formatted tables with articles
2. **Artifacts**: `rss-feeds-output.json` (30 day retention)
3. **GitHub Pages**: Automatically generated HTML

## Extending with Notifications

The modular design supports adding notification integrations:

```yaml
- name: Collect Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds

- name: Send to Slack/Teams/Email
  run: |
    # Read ${{ steps.collect.outputs.output-file }}
    # Send notifications
```

