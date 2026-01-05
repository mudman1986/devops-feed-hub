# RSS Feed Collector Workflows

This repository contains multiple workflows that automatically collect news articles from RSS feeds and send them to different notification platforms.

## ⚠️ Important: MS Teams Limitation

**MS Teams webhooks only work for channels, NOT for personal accounts/chats.** If you need to receive RSS updates to your personal Teams account, use the **Email workflow** instead (enabled by default).

## Available Workflows

1. **rss-feed-collector-email.yml** - Email notifications (enabled by default) ✅ **Recommended for personal accounts**
2. **rss-feed-collector.yml** - Microsoft Teams channel notifications (manual trigger only)
3. **rss-feed-collector-slack.yml** - Slack notifications (manual trigger only)
4. **rss-feed-collector-discord.yml** - Discord notifications (manual trigger only)

The Email workflow runs automatically. Alternative workflows can be triggered manually or enabled by uncommenting their trigger configuration.

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

By default, the **Email workflow is enabled** and runs automatically on schedule and push events. This is the recommended option for receiving updates to your personal account.

**Why Email by default?**
MS Teams webhooks only work for channels, not for personal accounts/chats. Since you can't configure webhooks for your personal Teams account, email is the most reliable way to receive RSS updates directly.

To use alternative notification platforms:

**Option 1: Use Email (Default - Recommended)**
- Already enabled and configured for automatic runs
- Works with any email account (Gmail, Outlook, etc.)
- Configure EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_TO secrets
- See Email Integration section below for setup

**Option 2: Manual Trigger Other Workflows**
- Keep alternative workflows disabled (default)
- Trigger them manually when needed from the Actions tab

**Option 3: Enable Teams for a Channel**
- If you have access to a Teams channel (not personal account)
- Edit `rss-feed-collector.yml`
- Uncomment the `on:` section to enable schedule and push triggers
- Configure the MS_TEAMS_WEBHOOK_URL secret

**Option 4: Enable Slack or Discord**
- Edit the workflow file (e.g., `rss-feed-collector-slack.yml`)
- Uncomment the full `on:` section to enable schedule and push triggers
- Configure the required secrets

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

### Email Integration (Recommended for Personal Accounts)

**This is the default enabled workflow** and the recommended solution for receiving RSS updates to your personal account.

To configure email notifications:

1. Add email configuration as repository secrets:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `EMAIL_USERNAME`: Your email username (e.g., your Gmail address)
     - `EMAIL_PASSWORD`: Your email password or app-specific password
     - `EMAIL_TO`: Your email address (can be same as EMAIL_USERNAME, or comma-separated for multiple recipients)
     - `EMAIL_FROM`: (Optional) Sender email, defaults to EMAIL_USERNAME
     - `EMAIL_SERVER`: (Optional) SMTP server, defaults to smtp.gmail.com
     - `EMAIL_PORT`: (Optional) SMTP port, defaults to 587

2. **For Gmail users:**
   - You'll need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password for the EMAIL_PASSWORD secret

3. **For Outlook/Microsoft 365 users:**
   - Set `EMAIL_SERVER` to `smtp.office365.com`
   - Set `EMAIL_PORT` to `587`
   - Use your full email address as USERNAME
   - For 2FA accounts, create an app password

**Implementation**: The email workflow uses Python's built-in `smtplib` module for sending emails - no third-party actions or dependencies required.

### MS Teams Integration (Channels Only)

### MS Teams Integration (Channels Only)

**⚠️ Important: MS Teams webhooks only work for channels, NOT for personal accounts/chats.**

If you need to send updates to your personal Teams account, use the Email workflow instead (see above).

If you have access to a Teams channel and want to post there:

1. Create an Incoming Webhook in your MS Teams **channel** (not personal chat):
   - Go to your Teams channel
   - Click "..." → "Connectors" → "Incoming Webhook"
   - Configure and copy the webhook URL

2. Add the webhook URL as a repository secret:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `MS_TEAMS_WEBHOOK_URL`
   - Value: Your webhook URL

3. Enable the Teams workflow:
   - Edit `.github/workflows/rss-feed-collector.yml`
   - Uncomment the `on:` section to enable automatic triggers

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

3. Enable the Slack workflow:
   - Edit `.github/workflows/rss-feed-collector-slack.yml`
   - Uncomment the `on:` section to enable automatic triggers

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

3. Enable the Discord workflow:
   - Edit `.github/workflows/rss-feed-collector-discord.yml`
   - Uncomment the `on:` section to enable automatic triggers

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
