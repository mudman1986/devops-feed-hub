# Folder Structure Refactoring Summary

## Problem Identified

The original folder structure had a **critical flaw** that would break when extracting the RSS feed collector action to a separate repository:

### Original Structure Issues

```
actions/collect-rss-feeds/
├── collect_feeds.py         # Used by action
├── generate_summary.py      # Used by action AND workflows directly
├── generate_rss.py          # Used ONLY by workflows (never by action!)
├── utils.py                 # Used by all Python scripts
└── template.html            # Used for HTML generation
```

**The Problem:**

- Workflows called `generate_summary.py` and `generate_rss.py` **directly** (not through the action)
- These scripts lived inside the action directory
- When the action is extracted, workflows would lose access to these scripts → **breakage**

### Why This Happened

The action was originally designed to be all-in-one, but evolved to have:

1. **Action functionality**: Collect feeds, output JSON
2. **Workflow functionality**: Generate HTML pages, generate RSS feeds

This mixed responsibility created a dependency that would break on extraction.

## Solution Implemented

### Clear Separation of Concerns

**Action** (portable, will be extracted):

```
actions/collect-rss-feeds/
├── action.yml
├── collect_feeds.py              # Core: collects RSS feeds
├── generate_markdown_summary.py  # Minimal: generates workflow summaries
└── tests/
    ├── test_collect_feeds.py
    └── test_parse_rss_feed.py
```

**Workflow Scripts** (stays in this repository):

```
.github/workflows/scripts/rss-processing/
├── generate_summary.py           # Full: HTML + markdown generation
├── generate_rss.py               # RSS XML feed generation
├── utils.py                      # Shared utilities
├── template.html                 # HTML template
└── tests/
    ├── test_generate_summary.py
    ├── test_generate_rss.py
    └── test_feed_ordering.py
```

## Changes Made

### 1. Moved RSS Processing Scripts

**Moved to** `.github/workflows/scripts/rss-processing/`:

- `generate_summary.py` (full version with HTML generation)
- `generate_rss.py` (RSS feed generation)
- `utils.py` (shared utilities)
- `template.html` (HTML template)
- Tests for all of the above

### 2. Created Lightweight Action Alternative

**Created** `actions/collect-rss-feeds/generate_markdown_summary.py`:

- Minimal script for GitHub workflow summaries only
- No HTML generation (not needed by action)
- No external dependencies beyond action requirements

### 3. Updated All References

**Workflows updated**:

- `rss-github-page.yml` → Now calls `.github/workflows/scripts/rss-processing/generate_summary.py`
- `ui-tests.yml` → Now calls `.github/workflows/scripts/rss-processing/generate_summary.py`

**Action updated**:

- `action.yml` → Now calls `generate_markdown_summary.py` (local to action)

**Tests updated**:

- `ci-tests.yml` → Now runs tests from both locations

### 4. Updated Documentation

**Created**:

- `FOLDER_STRUCTURE.md` - Comprehensive structure documentation
- `.github/workflows/scripts/rss-processing/README.md` - RSS processing scripts guide
- Updated all existing readmes to reflect new structure

## Benefits

### ✅ Future-Proof for Extraction

When extracting the action:

- **Action moves**: Entire `actions/collect-rss-feeds/` directory
- **Workflows work**: They use scripts in `.github/workflows/scripts/rss-processing/`
- **No breakage**: Clean separation means no dependencies to break

### ✅ Clear Separation of Concerns

- **Data collection** (action): Focused, portable, reusable
- **Presentation** (workflow scripts): Project-specific, can evolve independently

### ✅ Maintainability

- Each component has clear ownership
- Tests are colocateed with code
- Documentation explains intent and design

### ✅ All Tests Pass

- 10 action tests ✓
- 65 workflow script tests ✓
- **Total: 75 tests passing**

## File Inventory

### Removed from Action

- ❌ `generate_summary.py` (moved to workflow scripts)
- ❌ `generate_rss.py` (moved to workflow scripts)
- ❌ `utils.py` (moved to workflow scripts)
- ❌ `template.html` (moved to workflow scripts)
- ❌ `tests/test_generate_summary.py` (moved)
- ❌ `tests/test_generate_rss.py` (moved)
- ❌ `tests/test_feed_ordering.py` (moved)

### Added to Action

- ✅ `generate_markdown_summary.py` (new, lightweight)

### Added to Workflow Scripts

- ✅ `.github/workflows/scripts/rss-processing/generate_summary.py`
- ✅ `.github/workflows/scripts/rss-processing/generate_rss.py`
- ✅ `.github/workflows/scripts/rss-processing/utils.py`
- ✅ `.github/workflows/scripts/rss-processing/template.html`
- ✅ `.github/workflows/scripts/rss-processing/tests/` (all test files)
- ✅ `.github/workflows/scripts/rss-processing/README.md`

### Updated

- ✏️ `actions/collect-rss-feeds/action.yml`
- ✏️ `actions/collect-rss-feeds/README.md`
- ✏️ `actions/collect-rss-feeds/tests/test_collect_feeds.py`
- ✏️ `actions/README.md`
- ✏️ `.github/workflows/rss-github-page.yml`
- ✏️ `.github/workflows/ui-tests.yml`
- ✏️ `.github/workflows/ci-tests.yml`
- ✏️ `.github/workflows/scripts/README.md`

## Migration Path

When ready to extract the action to a separate repository:

1. **Create new repository** (e.g., `username/rss-feed-collector-action`)
2. **Copy** `actions/collect-rss-feeds/` → new repository root
3. **Update workflow** to use external action:
   ```yaml
   - uses: username/rss-feed-collector-action@v1
   ```
4. **No other changes needed** - workflows already use local scripts

## Testing

All changes verified:

```bash
# Action tests
python3 -m pytest actions/collect-rss-feeds/tests/ -v
# ✓ 10 passed

# Workflow script tests
python3 -m pytest .github/workflows/scripts/rss-processing/tests/ -v
# ✓ 65 passed

# All tests
python3 -m pytest actions/ .github/ -v
# ✓ 75 passed
```

## Conclusion

The refactoring successfully:

- ✅ Identified and fixed the extraction blocker
- ✅ Created clear separation between action and workflow logic
- ✅ Maintained all functionality (100% tests passing)
- ✅ Improved maintainability and documentation
- ✅ Made the action truly portable and extraction-ready

The repository now has a clean, sustainable structure that supports future component extraction without breaking existing workflows.
