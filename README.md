# DevOps Feed Hub 📰

A centralized RSS feed aggregator for DevOps, cloud, and technology news. This project automatically collects and displays the latest articles from leading tech blogs and news sources, making it easy to stay updated with the fast-paced DevOps ecosystem.

## 🎯 Purpose

DevOps Feed Hub serves as a single destination to track updates from:

- Microsoft DevOps Blog
- GitHub Blog & Changelog
- Microsoft Entra Blog
- Azure Updates
- HashiCorp Blog
- Microsoft Security Blog
- And more...

The project features a modern, responsive web interface with dark/light theme support, article filtering by timeframe, and mark-as-read functionality.

## 🚀 Features

- **Automated Feed Collection**: GitHub Actions workflow runs automatically to fetch the latest articles
- **Modern Web Interface**: Clean, responsive design that works on all devices
- **Smart Filtering**: View articles from the last 24 hours, 7 days, or 30 days
- **Mark as Read**: Track which articles you've already read with localStorage persistence
- **Theme Toggle**: Switch between dark and light modes
- **GitHub Pages Hosting**: Live site automatically deployed and updated

## 📖 Live Site

View the live feed at: [https://mudman1986.github.io/devops-feed-hub/](https://mudman1986.github.io/devops-feed-hub/)

## 🛠️ How It Works

1. GitHub Actions workflow runs on a schedule (weekdays at 9:00 AM UTC) and on push
2. The workflow collects RSS feeds from configured sources
3. Generates HTML pages with the latest articles
4. Commits and pushes updated content to GitHub Pages
5. The live site is automatically updated

## 📝 Configuration

RSS feeds are configured in `.github/rss-feeds.json`. To add or modify feeds, edit this file and the workflow will automatically use the updated configuration.

## 🧪 Testing

The project includes comprehensive test coverage:

- **JavaScript Unit Tests**: `npm test`
- **Python Unit Tests**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v`
- **UI Tests**: `npm run test:ui`

See [TESTING.md](TESTING.md) for detailed testing documentation.
