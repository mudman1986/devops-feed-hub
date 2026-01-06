# RSS Feed Collector - Composite Action

A reusable GitHub Actions composite action for collecting and processing RSS/Atom feeds.

## Features

- ✅ Uses `feedparser` library for robust RSS/Atom parsing
- ✅ Outputs results as structured JSON
- ✅ Generates formatted GitHub workflow summary
- ✅ Configurable time window for article collection
- ✅ Graceful error handling for unavailable feeds
- ✅ Supports both RSS 2.0 and Atom feeds

## Usage

### Basic Example

```yaml
- name: Collect RSS Feeds
  uses: ./.github/actions/collect-rss-feeds
  with:
    config-path: '.github/rss-feeds.json'
    hours: 24
    output-path: 'rss-output.json'
```

### With Outputs

```yaml
- name: Collect RSS Feeds
  id: collect
  uses: ./.github/actions/collect-rss-feeds
  with:
    config-path: '.github/rss-feeds.json'
    hours: 24

- name: Use outputs
  run: |
    echo "Collected ${{ steps.collect.outputs.total-articles }} articles"
    echo "From ${{ steps.collect.outputs.successful-feeds }} feeds"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `config-path` | Path to RSS feeds configuration JSON file | No | `.github/rss-feeds.json` |
| `hours` | Fetch articles from the last N hours | No | `24` |
| `output-path` | Path where output JSON will be saved | No | `rss-feeds-output.json` |

## Outputs

| Output | Description |
|--------|-------------|
| `output-file` | Path to the generated JSON output file |
| `total-articles` | Total number of articles collected |
| `successful-feeds` | Number of successfully fetched feeds |
| `failed-feeds` | Number of failed feeds |

## Configuration File Format

The configuration file should be a JSON file with the following structure:

```json
{
  "feeds": [
    {
      "name": "Feed Name",
      "url": "https://example.com/feed.xml"
    },
    {
      "name": "Another Feed",
      "url": "https://example.com/atom.xml"
    }
  ]
}
```

## Output JSON Format

The action generates a JSON file with the following structure:

```json
{
  "metadata": {
    "collected_at": "2024-01-01T12:00:00+00:00",
    "since": "2024-01-01T00:00:00",
    "hours": 24
  },
  "feeds": {
    "Feed Name": {
      "url": "https://example.com/feed.xml",
      "articles": [
        {
          "title": "Article Title",
          "link": "https://example.com/article",
          "published": "2024-01-01T10:00:00+00:00"
        }
      ],
      "count": 1
    }
  },
  "failed_feeds": [
    {
      "name": "Failed Feed",
      "url": "https://failed.com/feed.xml"
    }
  ],
  "summary": {
    "total_feeds": 2,
    "successful_feeds": 1,
    "failed_feeds": 1,
    "total_articles": 1
  }
}
```

## Future Extensions

This modular action can be used as a base for sending notifications to:
- Email
- Slack
- Microsoft Teams
- Discord
- Or any other notification service

Simply use the JSON output from this action in subsequent workflow steps or jobs.

## Dependencies

- Python 3.11+
- feedparser (installed automatically)
- jq (available in GitHub Actions runners)
