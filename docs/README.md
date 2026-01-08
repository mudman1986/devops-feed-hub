# DevOps Feed Hub - GitHub Pages

This directory contains the GitHub Pages content for DevOps Feed Hub.

## What is this?

The HTML files in this directory are automatically generated and updated by the RSS Feed Collector GitHub Actions workflow. The site displays the latest articles from configured DevOps and tech RSS feeds with features like:

- Time-based filtering (24 hours, 7 days, 30 days)
- Mark as read functionality
- Dark/light theme toggle
- Responsive design for all devices

## Viewing the Page

The live site is available at:

```text
https://mudman1986.github.io/devops-feed-hub/
```

## How It Updates

The page is automatically updated by the workflow:

1. **On Schedule**: The workflow runs Monday-Friday at 9:00 AM UTC
2. **On Push**: The workflow runs whenever code is pushed to the repository
3. **Manual**: You can trigger the workflow manually from the Actions tab

When the workflow runs, it collects RSS feeds, generates updated HTML files, and commits them back to this directory. GitHub Pages automatically deploys the changes.

## Customization

To customize the feeds being collected, edit:

```text
.github/rss-feeds.json
```

The HTML styling can be customized by modifying the generation logic in:

```text
.github/actions/collect-rss-feeds/generate_summary.py
```
