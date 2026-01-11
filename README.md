# DevOps Feed Hub 📰

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

## 📖 Live Site

View at: [https://mudman1986.github.io/devops-feed-hub/](https://mudman1986.github.io/devops-feed-hub/)

## 🛠️ How It Works

1. GitHub Actions workflow runs on schedule (weekdays at 9:00 AM UTC) and on push
2. Collects RSS feeds from configured sources (`.github/rss-feeds.json`)
3. Generates HTML pages with latest articles
4. Automatically updates GitHub Pages

## 🧪 Testing

- **JavaScript**: `npm test`
- **Python**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`
- **UI Tests**: `npm run test:ui`

See [TESTING.md](TESTING.md) for details.

## 🔧 Configuration

Edit `.github/rss-feeds.json` to add or modify RSS feeds.

## 📋 Design Documents

- **[Session Persistence Design](docs/SESSION_PERSISTENCE_DESIGN.md)**: OAuth-based cross-device settings sync (GitHub and Sign in with Apple options)
