# RSS Feed Collector Workflow

This workflow automatically collects news articles from multiple RSS feeds and sends them to Microsoft Teams.

## Features

- ✅ Scheduled to run on weekdays (Monday-Friday) at 9 AM UTC
- ✅ Triggers on every push to the repository
- ✅ Finds articles posted since the last successful run (or last 24 hours if already run today)
- ✅ Configurable RSS feeds via JSON file
- ✅ Gracefully handles unavailable RSS feeds
- ✅ Formats results as markdown tables
- ✅ Sends formatted results to MS Teams (if configured)
- ✅ Saves results as workflow artifacts

## Configuration

### RSS Feeds

RSS feeds are configured in `.github/rss-feeds.json`. The file contains:
- A list of feeds with name and URL
- Comments with additional suggested feeds to evaluate

To add or modify feeds, edit `.github/rss-feeds.json`:

```json
{
  "feeds": [
    {
      "name": "Feed Name",
      "url": "https://example.com/feed.xml"
    }
  ]
}
```

### MS Teams Integration

To enable MS Teams notifications:

1. Create an Incoming Webhook in your MS Teams channel:
   - Go to your Teams channel
   - Click "..." → "Connectors" → "Incoming Webhook"
   - Configure and copy the webhook URL

2. Add the webhook URL as a repository secret:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `MS_TEAMS_WEBHOOK_URL`
   - Value: Your webhook URL

If the secret is not configured, the workflow will still run and save results as artifacts, but won't send Teams notifications.

## Default RSS Feeds

The workflow monitors these feeds by default:

1. **Microsoft DevOps Blog** - Updates on Azure DevOps and DevOps practices
2. **GitHub Blog** - Official GitHub announcements and features
3. **Microsoft Entra Blog** - Microsoft identity and access management updates
4. **Azure Updates** - Azure service updates and new features
5. **GitHub Changelog** - GitHub feature changes and updates

## Additional Suggested Feeds

Consider adding these feeds (listed in `.github/rss-feeds.json` comments):

- **AWS What's New** - AWS service announcements
- **Docker Blog** - Container technology updates
- **Kubernetes Blog** - Kubernetes project news
- **HashiCorp Blog** - Infrastructure as Code updates
- **Stack Overflow Blog** - Developer community insights
- **Dev.to** - Developer articles and tutorials
- **Medium Engineering** - Engineering best practices
- **Google Cloud Blog** - GCP updates and announcements
- **Microsoft Security** - Security updates and best practices

## Output Format

Results are formatted as markdown tables:

### Successful Feeds

For each RSS feed with new articles:

| Title | Published |
|-------|-----------|
| [Article Title](link) | 2024-01-05 09:00 |

### Failed Feeds

If any feeds couldn't be retrieved:

| Feed Name |
|-----------|
| Failed Feed Name |

## Manual Execution

You can manually trigger the workflow:

1. Go to the "Actions" tab in your repository
2. Select "RSS Feed Collector" workflow
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

## Viewing Results

Results are available in multiple ways:

1. **MS Teams** - If configured, formatted results are sent to your Teams channel
2. **Workflow Summary** - Check the workflow run summary for formatted output
3. **Artifacts** - Download `rss-feed-results` artifact containing:
   - `rss-output.json` - Raw JSON data
   - `rss-output.md` - Formatted markdown

## Troubleshooting

### No articles found
- Check if the RSS feeds have published new articles in the time window
- Verify the feeds are accessible and valid

### Failed to retrieve feed
- The feed URL might be incorrect or the service might be down
- Some feeds may require specific user agents or authentication
- The workflow will continue with other feeds and report which ones failed

### Teams notifications not working
- Verify the `MS_TEAMS_WEBHOOK_URL` secret is set correctly
- Check that the webhook is still active in Teams
- Review the workflow logs for error messages

## Scripts

- `.github/scripts/fetch_rss_feeds.py` - Python script that fetches and parses RSS feeds

The script can be run locally for testing:

```bash
python .github/scripts/fetch_rss_feeds.py \
  --config .github/rss-feeds.json \
  --hours 24 \
  --output rss-output.json \
  --markdown-output rss-output.md
```

## Requirements

- Python 3.11+ (managed by the workflow)
- No external Python dependencies (uses only standard library)
