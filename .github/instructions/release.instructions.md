---
applyTo: ".github/workflows/create-release.yml,config/release.json,scripts/workflows/resolve_release.py,starter-sites/crypto-feed-hub/.github/workflows/publish.yml,starter-sites/crypto-feed-hub/README.md"
---

# Release Automation Development

## Source of Truth

- Treat `config/release.json` as the only release-tag source of truth
- Keep the starter workflow pin and starter-doc references aligned to
  `config/release.json`

## Workflow Behavior

- The release workflow must never commit or push branch changes
- Release automation should run from `push` events on `main`
- Create the tag and GitHub Release from the exact committed `main` revision
- If the configured tag already exists, skip release creation cleanly with a clear summary

## Validation

- Validate release tags with the `vX.Y.Z` format
- Fail fast when the committed release config, starter pin, and starter-doc
  references disagree
