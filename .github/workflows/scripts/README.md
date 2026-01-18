# Workflow Scripts

This directory contains scripts that are specifically used by GitHub Actions workflows.

## Scripts

### assign-copilot-workflow.js

Main workflow logic for automatically assigning issues to Copilot.

**Used by**: `.github/workflows/assign-copilot-issues.yml`

### assign-copilot.js

Core logic for issue assignment, including priority handling and filtering.

**Used by**: `assign-copilot-workflow.js`

### assign-copilot.test.js

Jest tests for the Copilot assignment logic.

**Run with**: `npm test`

### commit-github-pages.sh

Script for committing and pushing GitHub Pages content to a branch.

**Used by**: `.github/workflows/rss-github-page.yml`

**Usage**:
```bash
bash .github/workflows/scripts/commit-github-pages.sh <content-dir> <target-branch>
```

## Guidelines

- Scripts in this directory are workflow-specific and tightly coupled to GitHub Actions
- These scripts are not intended for direct use by developers
- Test coverage should be maintained for all JavaScript logic
