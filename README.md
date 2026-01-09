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

1. GitHub Actions workflow runs on schedule (weekdays at 9:00 AM UTC) and on push to main
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

## 📚 Documentation

- **[Custom Agents Guide](docs/CUSTOM_AGENTS.md)**: Learn about specialized AI agents for code quality, testing, and UI/UX
- **[MCP Servers](docs/MCP_SERVERS.md)**: Information about Model Context Protocol servers in use
- **[Testing Guide](TESTING.md)**: Comprehensive testing documentation

## 🤖 Development with Copilot

This repository is optimized for GitHub Copilot development:

- **Custom agents** available for refactoring, linting/testing, and UI/UX review
- **Automated workflows** for continuous integration and deployment
- **Path-specific instructions** guide Copilot for different file types
- **Weekly refactoring** automated via GitHub Actions

See [docs/CUSTOM_AGENTS.md](docs/CUSTOM_AGENTS.md) for details on using custom agents.

## 🔄 Automated Workflows

- **CI Tests**: Run on every push and PR
- **Super-Linter**: Validate code quality on every push and PR
- **UI Tests**: Test responsive design and functionality
- **RSS Collection**: Scheduled weekdays at 9:00 AM UTC
- **Weekly Refactor**: Automated code improvement every Monday

## 🤝 Contributing

This project follows strict code quality standards:

1. All linters must pass (run `super-linter` locally)
2. All tests must pass (JavaScript, Python, UI)
3. Code should be well-tested and documented
4. Follow existing patterns and conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed guidelines.
