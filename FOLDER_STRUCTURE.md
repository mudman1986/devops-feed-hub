# Repository Folder Structure

This document explains the organization of files and directories in this repository.

## Overview

The repository is structured to support **future extraction** of reusable components (like the RSS feed collector action) to separate repositories while keeping workflow-specific logic in this repo.

## Directory Layout

```
devops-feed-hub/
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   │   ├── *.yml          # Workflow definitions
│   │   ├── scripts/       # Workflow-specific scripts
│   │   │   ├── rss-processing/     # RSS HTML/feed generation scripts
│   │   │   │   ├── generate_summary.py
│   │   │   │   ├── generate_rss.py
│   │   │   │   ├── utils.py
│   │   │   │   ├── template.html
│   │   │   │   └── tests/
│   │   │   └── commit-github-pages.sh
│   │   └── test-fixtures/ # Test data for workflows
│   └── rss-feeds.json     # RSS feed configuration
│
├── actions/               # Reusable GitHub Actions
│   └── collect-rss-feeds/ # RSS feed collector action (portable)
│       ├── action.yml
│       ├── collect_feeds.py
│       ├── generate_markdown_summary.py
│       └── tests/
│
├── docs/                  # GitHub Pages content (generated)
│
├── scripts/               # Utility scripts
│   └── test/             # Test utilities and helpers
│
└── tests/                # End-to-end tests
    └── ui/               # Playwright UI tests
```

## Key Directories

### `.github/workflows/`

Contains GitHub Actions workflows and workflow-specific scripts.

**Workflows**:
- `rss-github-page.yml` - Collects feeds and publishes to GitHub Pages
- `ui-tests.yml` - Runs Playwright UI tests
- `ci-tests.yml` - Runs all unit tests
- `super-linter.yml` - Code quality checks

**Scripts** (`.github/workflows/scripts/`):
- `rss-processing/` - Scripts for generating HTML and RSS feeds from collected data
- `commit-github-pages.sh` - Commits and pushes to GitHub Pages branch

These scripts are **workflow-specific** and will stay in this repo when the action is extracted.

### `actions/`

Contains reusable composite actions designed to be portable and potentially extracted to separate repositories.

**Current actions**:
- `collect-rss-feeds/` - Collects RSS/Atom feeds and outputs JSON

**Design principle**: Actions focus on a single responsibility (data collection) and don't include presentation logic (HTML/RSS generation). This keeps them lightweight and portable.

### `docs/`

Generated GitHub Pages content (HTML, CSS, JavaScript). This directory is managed by the `rss-github-page.yml` workflow.

### `scripts/test/`

Test utilities and helper scripts:
- `generate-test-data.sh` - Generates test data
- `test_commit_github_pages.bats` - BATS tests for shell scripts

### `tests/`

End-to-end tests that validate the entire system:
- `ui/` - Playwright tests for the generated GitHub Pages interface

## Separation of Concerns

### Action vs. Workflow Scripts

**Action (`actions/collect-rss-feeds/`):**
- ✅ Collects RSS feed data
- ✅ Outputs structured JSON
- ✅ Generates markdown workflow summaries
- ❌ Does NOT generate HTML pages
- ❌ Does NOT generate RSS XML feeds

**Workflow Scripts (`.github/workflows/scripts/rss-processing/`):**
- ✅ Generates HTML pages for GitHub Pages
- ✅ Generates RSS XML feeds
- ✅ Handles project-specific formatting
- ❌ Does NOT collect feed data

This separation ensures:
1. The action can be extracted without breaking workflows
2. Project-specific presentation logic evolves independently
3. The action remains focused and lightweight

## Future Extraction Plan

When extracting the `collect-rss-feeds` action to a separate repository:

**What moves:**
- `actions/collect-rss-feeds/` (entire directory)

**What stays:**
- `.github/workflows/scripts/rss-processing/` (HTML/RSS generation)
- All workflows (will reference the extracted action via `owner/repo@version`)

**Why this works:**
- Workflows call `generate_summary.py` and `generate_rss.py` directly (not through the action)
- The action only provides JSON data; workflows handle presentation
- No breaking changes to workflow functionality

## Testing Strategy

### Action Tests
Located in `actions/collect-rss-feeds/tests/`:
- Test feed collection logic
- Test data parsing
- Test error handling

### Workflow Script Tests
Located in `.github/workflows/scripts/rss-processing/tests/`:
- Test HTML generation
- Test RSS feed generation
- Test template rendering

### UI Tests
Located in `tests/ui/`:
- Test generated GitHub Pages interface
- Test navigation and filtering
- Test theme switching and persistence

### Running Tests

```bash
# Action tests
python3 -m pytest actions/collect-rss-feeds/tests/ -v

# Workflow script tests
python3 -m pytest .github/workflows/scripts/rss-processing/tests/ -v

# UI tests
npx playwright test

# All tests
npm test
```

## Best Practices

1. **Keep actions portable**: Don't add project-specific logic to actions
2. **Workflow scripts for presentation**: HTML/RSS generation stays in workflow scripts
3. **Clear separation**: Data collection (action) vs. presentation (workflow scripts)
4. **Test both layers**: Unit tests for scripts, UI tests for output
5. **Document intent**: READMEs explain the purpose and portability of each component

## Related Documentation

- [Actions README](actions/README.md) - Details on reusable actions
- [RSS Processing Scripts](. github/workflows/scripts/rss-processing/README.md) - HTML/RSS generation
- [Testing Guide](TESTING.md) - How to run and write tests
