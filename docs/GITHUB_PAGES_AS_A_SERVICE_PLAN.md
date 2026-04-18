# GitHub Pages as a Service Plan

## Goal

Make this repository the reusable source of truth for the feed hub engine so a second site can be created in a new repository with only:

- a site metadata file (title, description, branding)
- an RSS feed list
- a tiny workflow that pins a released version of the shared engine

That keeps the site behavior, UI, tests, and deployment logic in one place and avoids copying the full repository for every new audience.

## Current Reusable Building Blocks

The repository already has most of the pieces needed for a shared platform:

- `scripts/workflows/rss-processing/generate_summary.py` generates the HTML pages.
- `scripts/workflows/rss-processing/generate_rss.py` generates the RSS output.
- `scripts/workflows/rss-processing/template.html` and `src/site/` contain the shared site shell.
- `.github/workflows/rss-github-page.yml` already handles collection, build, preview deployment, and Pages publishing.
- `config/rss-feeds.json` is already configuration driven for the feed sources.

The main remaining gap is that site branding is still hardcoded in several places instead of coming from config.

## Recommended Scalable Model

### 1. Keep this repository as the upstream "site engine"

This repository should own:

- shared HTML/CSS/JS assets
- RSS and HTML generation scripts
- Playwright/Jest/Python tests
- the reusable GitHub Actions workflow used to publish a site
- versioned releases for consumers

### 2. Add a small site metadata config

Introduce a config file such as `config/site-metadata.json` with fields like:

```json
{
  "site_name": "DevOps Feed Hub",
  "site_description": "Centralized RSS feed aggregator for DevOps and tech news",
  "header_title": "DevOps Feed Hub",
  "rss_title": "DevOps Feed Hub - All Articles",
  "rss_description": "Aggregated DevOps, cloud, and technology news from multiple sources"
}
```

Then update the generators and template to read branding from this file instead of hardcoded strings. That is the key refactor that makes the second site truly reusable.

### 3. Publish the engine as a versioned reusable workflow

Use a reusable workflow in this repository, published and consumed by tag:

- example consumer reference: `mudman1986/devops-feed-hub/.github/workflows/publish-site.yml@v1`
- inputs: `site-metadata-path`, `feeds-config-path`, `python-version`, optional `base-path`
- secrets: only the standard `GITHUB_TOKEN`

This should be the primary distribution mechanism because it avoids duplicating the current Pages workflow in every new repository.

### 4. Use GitHub Releases for bootstrap assets, not as the primary runtime

Each release should attach a small starter bundle that contains:

- sample `config/site-metadata.json`
- sample `config/rss-feeds.json`
- a minimal consumer workflow
- setup instructions

Releases are a good fit for versioned templates and examples. They are less useful than a reusable workflow for the ongoing build itself, because consumers would otherwise need to reimplement the workflow logic locally.

### 5. Treat GitHub Packages as optional

GitHub Packages only helps if the shared engine is split into an installable package. For this repository, the deployment workflow is the most valuable reusable unit, so Packages should be optional rather than the first step.

If packaging is desired later, the best candidate is a small Python package for the generators. That can happen after the reusable workflow is working.

## What a Consumer Repository Should Contain

A second site repository should stay very small:

```text
.github/workflows/publish.yml        # calls the reusable workflow by release tag
config/site-metadata.json            # title, description, branding
config/rss-feeds.json                # audience-specific feeds
README.md                            # repo-specific documentation
```

That repository should not copy:

- `src/site/`
- `scripts/workflows/rss-processing/`
- Playwright/Jest/Python test suites
- Pages deployment logic

## Rollout Plan

### Phase 1: Parameterize branding in this repository

Update the shared engine so these values come from config instead of being hardcoded:

- page title and meta description in `template.html`
- header title in `template.html`
- Markdown summary title in `generate_summary.py`
- RSS feed titles and descriptions in `generate_rss.py`

### Phase 2: Extract a reusable workflow

Create a `workflow_call` workflow that:

- checks out the consumer repository
- reads the consumer config files
- runs the feed collector
- builds HTML and RSS with the shared scripts
- publishes to GitHub Pages

The existing `.github/workflows/rss-github-page.yml` can then call the same reusable workflow internally so the upstream repository uses the same path as consumers.

### Phase 3: Release and document the template

For each tagged release:

- publish the reusable workflow under a stable tag (`v1`, `v1.1`, etc.)
- attach the starter bundle to the GitHub Release
- document the upgrade path for consumer repos

### Phase 4: Create the second site from the template

The second repository should prove the model by changing only:

- `config/site-metadata.json`
- `config/rss-feeds.json`
- the repository name / Pages URL

If more files are required, the shared layer is still too coupled.

## Why This Scales to 5+ Sites

This approach scales because:

- UI, tests, and deployment logic stay centralized.
- Each site repository is mostly configuration.
- Fixes ship once in the upstream repository and are adopted by bumping a version tag.
- New sites avoid forks and large copy/paste drift.
- Release tags provide stable, auditable upgrades.

## Recommendation

Use this repository as a versioned upstream platform, with a reusable workflow as the main distribution mechanism and GitHub Releases as the bootstrap/template channel.

That gives the least duplication for a second site now and stays manageable if another five sites are added later.
