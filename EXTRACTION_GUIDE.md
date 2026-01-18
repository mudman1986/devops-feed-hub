# RSS Feed Collector Action - Extraction Guide

## Overview

This guide explains how to extract the `collect-rss-feeds` action to a separate repository when ready.

## Why Extract?

The action is designed to be **portable** and **reusable**. Extracting it to a separate repository allows:
- Other projects to use the action
- Independent versioning and releases
- Focused maintenance and updates
- Clear separation of concerns

## Current State

The folder structure has been optimized for extraction:

**Action (portable)**:
```
actions/collect-rss-feeds/
├── action.yml                    # Action definition
├── collect_feeds.py              # Core feed collection logic
├── generate_markdown_summary.py  # Workflow summary generation
├── pyproject.toml                # Python configuration
├── README.md                     # Action documentation
└── tests/                        # Action tests
    ├── test_collect_feeds.py
    └── test_parse_rss_feed.py
```

**Workflow Scripts (stays in this repo)**:
```
.github/workflows/scripts/rss-processing/
├── generate_summary.py           # HTML page generation
├── generate_rss.py               # RSS feed generation
├── utils.py                      # Shared utilities
├── template.html                 # HTML template
├── README.md                     # Documentation
└── tests/                        # Script tests
    ├── test_generate_summary.py
    ├── test_generate_rss.py
    └── test_feed_ordering.py
```

## Extraction Steps

### 1. Create New Repository

Create a new repository for the action:
```bash
# Example: username/rss-feed-collector-action
gh repo create username/rss-feed-collector-action --public
```

### 2. Copy Action Files

Copy the entire action directory to the new repo root:
```bash
# In the new repo
cp -r /path/to/devops-feed-hub/actions/collect-rss-feeds/* .
```

### 3. Add Required Files

Add standard repo files to the new action repo:

**LICENSE** - Copy from parent repo or choose appropriate license

**README.md** - Expand the action README with:
- Detailed usage examples
- Configuration options
- Contributing guidelines
- Support information

**CHANGELOG.md** - Track version changes

**.gitignore** - Python-specific ignores:
```gitignore
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
htmlcov/
.coverage
```

**GitHub Actions Workflow** - Add CI for the action:
```yaml
# .github/workflows/test.yml
name: Test Action
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v6
        with:
          python-version: '3.x'
      - run: pip install feedparser pytest pytest-cov
      - run: pytest tests/ -v --cov
```

### 4. Update Parent Repo Workflow

In the devops-feed-hub repo, update workflow to use external action:

**Before** (local action):
```yaml
- name: Collect RSS Feeds
  uses: ./actions/collect-rss-feeds
  with:
    config-path: ".github/rss-feeds.json"
    hours: "720"
    output-path: "rss-feeds-output.json"
```

**After** (external action):
```yaml
- name: Collect RSS Feeds
  uses: username/rss-feed-collector-action@v1
  with:
    config-path: ".github/rss-feeds.json"
    hours: "720"
    output-path: "rss-feeds-output.json"
```

### 5. Remove Local Action

After verifying the external action works:
```bash
# In devops-feed-hub repo
rm -rf actions/collect-rss-feeds
rm -rf actions/README.md  # If no other actions remain
rmdir actions/  # If empty
```

### 6. Update Documentation

Update docs in devops-feed-hub:
- Remove references to local action
- Update FOLDER_STRUCTURE.md
- Update TESTING.md
- Update any developer guides

## Verification Checklist

Before extraction:
- [ ] All action tests pass locally
- [ ] Action works in workflows
- [ ] Documentation is complete
- [ ] Dependencies are listed
- [ ] No hardcoded paths specific to devops-feed-hub

After extraction:
- [ ] New repo has all required files
- [ ] CI passes in new repo
- [ ] Action can be used from external repos
- [ ] Workflows in devops-feed-hub still work
- [ ] Documentation is updated in both repos

## Version Strategy

### Initial Release (v1.0.0)

First release of the extracted action:
- Stable, tested functionality
- Complete documentation
- Semantic versioning

### Future Releases

Follow semantic versioning:
- **Patch** (v1.0.1): Bug fixes, no breaking changes
- **Minor** (v1.1.0): New features, backward compatible
- **Major** (v2.0.0): Breaking changes

### Release Process

1. Update CHANGELOG.md
2. Tag release: `git tag -a v1.0.0 -m "Release v1.0.0"`
3. Push tag: `git push origin v1.0.0`
4. Create GitHub release with notes
5. Test action using new version

## Migration for Users

If others are using the local action:

**Option 1: Gradual Migration**
```yaml
# Keep old usage temporarily, add warning in docs
uses: ./actions/collect-rss-feeds  # Deprecated, use username/rss-feed-collector-action@v1
```

**Option 2: Immediate Migration**
```yaml
# Update all at once
uses: username/rss-feed-collector-action@v1
```

## Benefits of Extraction

### For Action Users
✅ Semantic versioning (pin to specific versions)  
✅ Independent updates (not tied to parent repo releases)  
✅ Focused issue tracking  
✅ Clear action-specific documentation  

### For devops-feed-hub
✅ Cleaner repo structure  
✅ Workflow scripts stay project-specific  
✅ No breaking changes (workflows use external action)  
✅ Easier to maintain  

### For Maintainers
✅ Separate release cycles  
✅ Action-focused PRs and issues  
✅ Better community contributions  
✅ Clear ownership boundaries  

## Support After Extraction

**Action issues**: Report in `username/rss-feed-collector-action`  
**Workflow issues**: Report in `devops-feed-hub`  
**HTML/RSS generation issues**: Report in `devops-feed-hub` (workflow scripts)

## FAQ

**Q: Will extraction break existing workflows?**  
A: No. Workflows will be updated to use the external action, but functionality remains the same.

**Q: What about the HTML/RSS generation scripts?**  
A: They stay in devops-feed-hub. The action only collects feeds; presentation is project-specific.

**Q: Can I still customize the action for devops-feed-hub?**  
A: Yes. Fork the action repo and reference your fork, or contribute improvements upstream.

**Q: How do I test changes before extraction?**  
A: Test locally with the current structure. The separation is already in place.

## Next Steps

1. Ensure all tests pass: `python3 -m pytest actions/collect-rss-feeds/tests/ -v`
2. Review action documentation: `actions/collect-rss-feeds/README.md`
3. Verify no project-specific dependencies in action code
4. Create new repo when ready
5. Follow extraction steps above
6. Test thoroughly before removing local action

## Contact

For questions about extraction, open an issue in devops-feed-hub with label `extraction`.
