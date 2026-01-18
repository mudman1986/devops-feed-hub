# RSS Processing Scripts

Workflow-specific scripts for generating HTML pages and RSS feeds from collected feed data.

These scripts are used by workflows to post-process the output from the `collect-rss-feeds` action.

## Scripts

### generate_summary.py

Generates HTML pages and markdown summaries from RSS feed collection JSON data.

**Usage:**
```bash
# Generate HTML pages
python3 generate_summary.py --input feed-data.json --output-dir docs/

# Generate markdown summary
python3 generate_summary.py --input feed-data.json --markdown summary.md
```

**Purpose**: Creates multi-page HTML interface for GitHub Pages with:
- Main index page with all feeds
- Individual feed pages
- Summary statistics page
- Navigation and filtering

### generate_rss.py

Generates RSS 2.0 XML feeds from collected feed data.

**Usage:**
```bash
python3 generate_rss.py --input feed-data.json --output-dir docs/
```

**Purpose**: Creates RSS feeds for subscribers:
- Master feed with all articles
- Individual feed-specific RSS files

### utils.py

Shared utility functions used by both `generate_summary.py` and `generate_rss.py`:
- `generate_feed_slug()` - Create URL-safe slugs
- `parse_iso_timestamp()` - Parse ISO 8601 timestamps
- `sort_articles_by_date()` - Sort articles by publication date

## Dependencies

- Python 3.x standard library only (no external dependencies)

## Design Notes

These scripts are **workflow-specific** and will remain in this repository when the 
`collect-rss-feeds` action is extracted to a separate repository.

The action only collects feed data - these scripts handle presentation and formatting,
which is specific to this project's GitHub Pages deployment.
