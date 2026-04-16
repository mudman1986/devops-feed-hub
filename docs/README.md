# DevOps Feed Hub Documentation

This directory stores project documentation only.

## Site Layout

The live site is now generated outside this directory:

```text
src/site/                         # authored site assets
scripts/workflows/rss-processing/ # site/RSS generation scripts
site/                             # generated site output for publishing/tests
config/rss-feeds.json             # feed configuration
```

## Site Publishing

The RSS publishing workflow generates the deployable site into `site/` and
publishes previews under `site/preview/<preview-slug>/`.

## Live Site

```text
https://mudman1986.github.io/devops-feed-hub/
```
