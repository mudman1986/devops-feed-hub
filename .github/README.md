# DevOps Feed Hub 📰

[![CI Tests](https://github.com/mudman1986/devops-feed-hub/actions/workflows/ci-tests.yml/badge.svg)](https://github.com/mudman1986/devops-feed-hub/actions/workflows/ci-tests.yml)
[![UI Tests](https://github.com/mudman1986/devops-feed-hub/actions/workflows/ui-tests.yml/badge.svg)](https://github.com/mudman1986/devops-feed-hub/actions/workflows/ui-tests.yml)
[![Super-Linter](https://github.com/mudman1986/devops-feed-hub/actions/workflows/super-linter.yml/badge.svg)](https://github.com/mudman1986/devops-feed-hub/actions/workflows/super-linter.yml)
[![codecov](https://codecov.io/gh/mudman1986/devops-feed-hub/branch/main/graph/badge.svg)](https://codecov.io/gh/mudman1986/devops-feed-hub)

A centralized RSS feed aggregator for DevOps, cloud, and technology news.

## 🎯 Purpose

Stay updated with the fast-paced DevOps ecosystem through a single destination tracking:

- Microsoft DevOps Blog, GitHub Blog & Changelog, Microsoft Entra Blog
- Azure Updates, HashiCorp Blog, Microsoft Security Blog
- And more...

## 🚀 Features

- **Automated Feed Collection**: GitHub Actions workflow fetches latest articles
- **Modern Web Interface**: Responsive design with dark/light theme support
- **Smart Filtering**: View articles from last 24 hours, 7 days, or 30 days
- **Mark as Read**: Track read articles with localStorage persistence
- **RSS Feed Endpoint**: Subscribe to aggregated feeds via RSS
  - Master feed with all articles: [feed.xml](https://mudman1986.github.io/devops-feed-hub/feed.xml)
  - Individual feed sources available in the sidebar

## 📖 Live Site

View at: [https://mudman1986.github.io/devops-feed-hub/](https://mudman1986.github.io/devops-feed-hub/)

## 🛠️ How It Works

1. GitHub Actions workflow runs on schedule (weekdays at 9:00 AM UTC) and on push
2. Collects RSS feeds from configured sources (`.github/rss-feeds.json`)
3. Generates HTML pages and RSS feeds with latest articles
4. Automatically updates GitHub Pages

## 🧪 Testing

- **JavaScript**: `npm test`
- **Python**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`
- **UI Tests**: `npm run test:ui`

See [TESTING.md](../TESTING.md) for details.

## 🔧 Configuration

Edit `.github/rss-feeds.json` to add or modify RSS feeds.
