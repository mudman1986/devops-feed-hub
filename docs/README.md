# DevOps Feed Hub - GitHub Pages

Automatically generated GitHub Pages content displaying latest DevOps and tech RSS feeds.

## Live Site

```text
https://mudman1986.github.io/devops-feed-hub/
```

## Features

- Time-based filtering (24 hours, 7 days, 30 days)
- Mark as read functionality
- Dark/light theme toggle
- Responsive design for all devices

## Updates

The page updates automatically:

- **Schedule**: Monday-Friday at 9:00 AM UTC
- **On Push**: To the repository
- **Manual**: Trigger workflow from Actions tab

The RSS Feed Collector workflow generates and commits updated HTML files to this directory.

## Customization

- **Edit feeds**: `.github/rss-feeds.json`
- **Modify styling**: `.github/actions/collect-rss-feeds/generate_summary.py`
