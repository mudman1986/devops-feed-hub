# RSS Feed Collector Workflows

This repository contains multiple workflows that automatically collect news articles from RSS feeds and send them to different notification platforms.

## Available Workflows

1. **rss-feed-collector.yml** - Microsoft Teams notifications (enabled by default)
2. **rss-feed-collector-slack.yml** - Slack notifications (manual trigger only)
3. **rss-feed-collector-discord.yml** - Discord notifications (manual trigger only)
4. **rss-feed-collector-email.yml** - Email notifications (manual trigger only)

The MS Teams workflow runs automatically. Alternative workflows can be triggered manually or enabled by uncommenting their trigger configuration.

All workflows share the same core functionality but deliver results to different platforms.

## Features

- ✅ Scheduled to run on weekdays (Monday-Friday) at 9 AM UTC
- ✅ Triggers on every push to the repository
- ✅ Finds articles posted since the last successful run (or last 24 hours if already run today)
- ✅ Configurable RSS feeds via JSON file
- ✅ Gracefully handles unavailable RSS feeds
- ✅ Formats results as markdown tables
- ✅ Multiple notification platforms (MS Teams, Slack, Discord, Email)
- ✅ Saves results as workflow artifacts

## Configuration

### Choosing Workflows

By default, only the MS Teams workflow is enabled and runs automatically on schedule and push events.

To use alternative notification platforms:

**Option 1: Manual Trigger**
- Keep workflows disabled (default)
- Trigger them manually when needed from the Actions tab

**Option 2: Enable Automatic Runs**
- Edit the workflow file (e.g., `rss-feed-collector-slack.yml`)
- Uncomment the full `on:` section to enable schedule and push triggers
- Comment out or remove the manual-only `on: workflow_dispatch:` section
- Configure the required secrets

**Option 3: Switch from MS Teams to Another Platform**
- Disable the MS Teams workflow by commenting out its triggers
- Enable your preferred workflow by uncommenting its triggers

You can also run multiple workflows simultaneously if you want notifications on multiple platforms.

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

### Slack Integration

To enable Slack notifications:

1. Create an Incoming Webhook in your Slack workspace:
   - Go to https://api.slack.com/messaging/webhooks
   - Create a new app or use an existing one
   - Enable Incoming Webhooks and create a webhook for your channel
   - Copy the webhook URL

2. Add the webhook URL as a repository secret:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Your webhook URL

### Discord Integration

To enable Discord notifications:

1. Create a webhook in your Discord server:
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Choose the channel and copy the webhook URL

2. Add the webhook URL as a repository secret:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Your webhook URL

### Email Integration

To enable Email notifications:

1. Add email configuration as repository secrets:
   - `EMAIL_USERNAME`: Your email username (e.g., your Gmail address)
   - `EMAIL_PASSWORD`: Your email password or app-specific password
   - `EMAIL_TO`: Recipient email address(es), comma-separated
   - `EMAIL_FROM`: (Optional) Sender email, defaults to EMAIL_USERNAME
   - `EMAIL_SERVER`: (Optional) SMTP server, defaults to smtp.gmail.com
   - `EMAIL_PORT`: (Optional) SMTP port, defaults to 587

**Note**: For Gmail, you'll need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

**Security Note**: The email workflow uses the `dawidd6/action-send-mail` GitHub Action (a widely-used action with 7k+ stars). This action will have access to your email credentials. Review the action's source code at https://github.com/dawidd6/action-send-mail if you have security concerns. Alternative: You can modify the workflow to use standard SMTP tools directly.

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

You can manually trigger any of the workflows:

1. Go to the "Actions" tab in your repository
2. Select the desired workflow (e.g., "RSS Feed Collector", "RSS Feed Collector (Slack)", etc.)
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

## Viewing Results

Results are available in multiple ways:

1. **Notification Platform** - If configured, formatted results are sent to:
   - MS Teams channel
   - Slack channel
   - Discord channel
   - Email inbox
2. **Workflow Summary** - Check the workflow run summary for formatted output
3. **Artifacts** - Download the results artifact containing:
   - `rss-output.json` - Raw JSON data
   - `rss-output.md` - Formatted markdown
   - `rss-output.html` - HTML formatted (email workflow only)

## Troubleshooting

### No articles found
- Check if the RSS feeds have published new articles in the time window
- Verify the feeds are accessible and valid

### Failed to retrieve feed
- The feed URL might be incorrect or the service might be down
- Some feeds may require specific user agents or authentication
- The workflow will continue with other feeds and report which ones failed

### Teams/Slack/Discord notifications not working
- Verify the respective webhook secret is set correctly
- Check that the webhook is still active
- Review the workflow logs for error messages

### Email not being sent
- Verify all required email secrets are set
- For Gmail, ensure you're using an App Password
- Check your email provider's SMTP settings
- Some email providers may block automated emails - check spam folder

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
