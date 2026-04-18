# Crypto Feed Hub Starter

Copy the contents of this folder into a new repository to bootstrap a
crypto-focused feed hub site that uses the shared Pages workflow from:

```text
mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1
```

## Included Files

```text
.github/workflows/publish.yml
config/site-metadata.json
config/rss-feeds.json
README.md
```

## Setup

1. Create a new GitHub repository for your crypto site.
2. Copy the full contents of this folder into the new repository root.
3. Review and update:
   - `config/site-metadata.json`
   - `config/rss-feeds.json`
4. Enable GitHub Pages for the repository.
5. Push to the default branch or run the workflow manually.

## What To Customize

### Site branding

Update `config/site-metadata.json` to change:

- site name
- header title
- page description
- RSS title and description

### Feed sources

Update `config/rss-feeds.json` to add, remove, or replace crypto feeds.

Each entry supports:

```json
{
  "name": "Feed name",
  "url": "https://example.com/rss.xml",
  "website_url": "https://example.com/"
}
```

## Upgrade Path

This starter pins the shared workflow to `@v1`.

When a newer release is available:

1. Review the upstream release notes.
2. Update `.github/workflows/publish.yml` to the new stable tag
   (for example `@v1.1`).
3. Commit and push the workflow change.

## Notes

- The shared engine repository owns the HTML, CSS, JavaScript, tests, and
  deployment logic.
- Consumer repositories should stay configuration-only whenever possible.
