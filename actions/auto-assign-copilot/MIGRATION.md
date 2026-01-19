# Migration Guide: Auto Assign Copilot Action

This guide explains how to migrate the `auto-assign-copilot` action to another GitHub repository.

## Prerequisites

- Target repository must have:
  - Issues enabled
  - GitHub Copilot access (for assigning the bot)
  - Appropriate labels configured (bug, documentation, refactor, enhancement)

## Migration Steps

### 1. Copy the Action

Copy the entire action directory to the target repository:

```bash
# From the source repository root
cp -r actions/auto-assign-copilot /path/to/target/repo/actions/

# Or using git
cd /path/to/target/repo
git checkout -b add-auto-assign-copilot-action
mkdir -p actions
cp -r /path/to/source/repo/actions/auto-assign-copilot actions/
```

### 2. Install Dependencies and Build

```bash
cd actions/auto-assign-copilot
npm install
npm run build
```

This creates the `dist/index.js` file that the action needs to run.

### 3. Commit the Action

**Important**: You must commit the `dist/` directory even though it's typically in `.gitignore` for the main repository.

```bash
# Add the action files
git add actions/auto-assign-copilot/

# If dist/ is in .gitignore, force add it for the action
git add -f actions/auto-assign-copilot/dist/

# Commit
git commit -m "Add auto-assign-copilot action"
```

### 4. Create a Workflow

Create `.github/workflows/assign-copilot.yml` in the target repository:

```yaml
name: Assign Issues to Copilot

on:
  # Daily schedule to ensure Copilot always has work
  schedule:
    - cron: "0 10 * * *" # Daily at 10 AM UTC

  # Trigger when an issue is closed
  issues:
    types: [closed]

  # Manual trigger
  workflow_dispatch:
    inputs:
      mode:
        description: "Assignment mode"
        required: true
        default: "auto"
        type: choice
        options:
          - auto
          - refactor
      dry_run:
        description: "Dry run mode"
        required: false
        type: boolean
        default: false

permissions:
  contents: read
  issues: write

jobs:
  assign-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Assign Copilot to issue
        uses: ./actions/auto-assign-copilot
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          mode: ${{ inputs.mode || 'auto' }}
          dry-run: ${{ inputs.dry_run || 'false' }}
```

### 5. Configure Labels

Ensure your target repository has the following labels:

- `bug` - For bug reports
- `documentation` - For documentation improvements
- `refactor` - For code refactoring tasks
- `enhancement` - For feature requests
- `no-ai` - (Optional) Skip this issue from auto-assignment
- `refining` - (Optional) Skip this issue from auto-assignment

Create missing labels via GitHub UI or using the GitHub CLI:

```bash
# Using GitHub CLI
gh label create bug --color d73a4a --description "Something isn't working"
gh label create documentation --color 0075ca --description "Improvements or additions to documentation"
gh label create refactor --color fbca04 --description "Code refactoring and improvements"
gh label create enhancement --color a2eeef --description "New feature or request"
gh label create no-ai --color e99695 --description "Do not assign to AI agents"
gh label create refining --color ededed --description "Issue needs refinement before work"
```

### 6. Set Up Permissions

#### Option A: Use GITHUB_TOKEN (Recommended for Public Repos)

The default `GITHUB_TOKEN` works for most cases:

```yaml
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
```

#### Option B: Use Personal Access Token (For Private Repos)

1. Create a Personal Access Token (PAT) with `repo` scope
2. Add it as a repository secret named `COPILOT_ASSIGN_PAT`
3. Update the workflow:

```yaml
with:
  github-token: ${{ secrets.COPILOT_ASSIGN_PAT }}
```

### 7. Test the Action

1. Commit and push the workflow
2. Go to Actions tab in GitHub
3. Run the workflow manually with "dry-run" enabled
4. Review the logs to ensure it works correctly
5. Run without dry-run to assign an issue

### 8. Verify Copilot Can Be Assigned

Ensure the `copilot-swe-agent` bot has access to your repository:

1. Go to repository Settings → Collaborators
2. Check if `copilot-swe-agent` appears in suggested actors
3. If not, you may need to enable GitHub Copilot for your organization

## Alternative: Publish to GitHub Marketplace

For easier reusability across multiple repositories, publish the action to the GitHub Marketplace:

### 1. Create a Dedicated Repository

```bash
# Create a new repository for the action
gh repo create auto-assign-copilot-action --public --description "GitHub Action to auto-assign Copilot to issues"

# Clone and set up
git clone https://github.com/YOUR_USERNAME/auto-assign-copilot-action.git
cd auto-assign-copilot-action

# Copy action files (exclude the actions/ parent directory)
cp -r /path/to/source/repo/actions/auto-assign-copilot/* .

# Initialize and build
npm install
npm run build
```

### 2. Update action.yml

Change the `runs.main` path since it's now at the repository root:

```yaml
runs:
  using: "node20"
  main: "dist/index.js"
```

### 3. Add Repository Files

Create essential files:

```bash
# Copy README and MIGRATION guide
cp README.md .
cp MIGRATION.md .

# Create LICENSE (if not exists)
cat > LICENSE << 'EOF'
MIT License
...
EOF

# Commit
git add .
git commit -m "Initial commit: Auto Assign Copilot Action"
git push origin main
```

### 4. Create a Release

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create release on GitHub
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

### 5. Use in Other Repositories

Now you can reference it from any repository:

```yaml
- name: Assign Copilot to issue
  uses: YOUR_USERNAME/auto-assign-copilot-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Customization Options

### Change Priority Order

Edit `src/workflow.js` and modify the `labelPriority` array:

```javascript
const labelPriority = labelOverride
  ? [labelOverride]
  : ["critical", "bug", "enhancement", "documentation"];
```

### Adjust Refactor Ratio

Change the default `refactor-threshold` in `action.yml`:

```yaml
refactor-threshold:
  description: "..."
  required: false
  default: "9" # 1 in 10 ratio instead of 1 in 5
```

### Modify Refactor Issue Template

Edit the issue body in `src/workflow.js` function `createRefactorIssue()`:

```javascript
body: [
  "Your custom refactor instructions here",
  "",
  "**Checklist:**",
  "- [ ] Fix linting errors",
  "- [ ] Update tests",
].join("\n");
```

## Troubleshooting

### Issue: Action fails with "Copilot bot agent not found"

**Solution**: Ensure GitHub Copilot is enabled for your repository/organization.

### Issue: Permission denied when assigning issues

**Solution**: Check that the workflow has `issues: write` permission and the token has appropriate scopes.

### Issue: dist/index.js not found

**Solution**: Make sure you ran `npm run build` and committed the `dist/` directory.

### Issue: Action assigns parent issues with sub-issues

**Solution**: Set `allow-parent-issues: false` (default) in the workflow.

### Issue: Refactor issues created too frequently

**Solution**: Increase `refactor-threshold` value (higher = less frequent refactor issues).

## Support

For issues, questions, or contributions, please open an issue in the source repository or the dedicated action repository if published separately.

## Version History

- **v1.0.0** - Initial release
  - Priority-based assignment
  - Refactor mode
  - Label filtering
  - Parent issue handling
  - Dry run mode

## License

This action is released under the MIT License. See LICENSE file for details.
