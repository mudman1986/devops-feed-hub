# Workflow Scripts

This directory contains scripts that are specifically used by GitHub Actions workflows.

## Directory Structure

### Root Scripts

#### commit-github-pages.sh

Script for committing and pushing GitHub Pages content to a branch.

**Used by**: `.github/workflows/rss-github-page.yml`

**Usage**:
```bash
bash .github/workflows/scripts/commit-github-pages.sh <content-dir> <target-branch>
```

### rss-processing/

Workflow-specific scripts for processing RSS feed data and generating output.

**Contains**:
- `generate_summary.py` - Generate HTML pages and markdown summaries
- `generate_rss.py` - Generate RSS 2.0 XML feeds
- `utils.py` - Shared utility functions
- `template.html` - HTML template for generated pages
- `tests/` - Unit tests for RSS processing scripts

**Used by**:
- `.github/workflows/rss-github-page.yml`
- `.github/workflows/ui-tests.yml`

**Documentation**: See [rss-processing/README.md](rss-processing/README.md)

## Design Principles

- Scripts in this directory are workflow-specific and tightly coupled to GitHub Actions
- These scripts are not intended for direct use by developers
- When reusable components are identified, they should be moved to separate actions
- Test coverage should be maintained for all logic

## Separation of Concerns

The RSS processing scripts are kept separate from the `collect-rss-feeds` action to:
- Keep the action portable and lightweight (ready for extraction to separate repo)
- Separate data collection (action) from presentation (workflow scripts)
- Allow this project's specific HTML/RSS formatting to evolve independently
