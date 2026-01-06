#!/bin/bash
# Script to commit and push GitHub Pages content
# Usage: commit-github-pages.sh <target-branch> <content-directory>

set -e

TARGET_BRANCH="${1:-github-pages}"
CONTENT_DIR="${2:-docs}"

# Configure git
git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"

# Check if target branch exists
if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
  echo "Branch $TARGET_BRANCH exists, switching to it" >&2
  git checkout "$TARGET_BRANCH"
else
  echo "Branch $TARGET_BRANCH does not exist, creating it" >&2
  git checkout -b "$TARGET_BRANCH"
fi

# Add the content directory
git add "$CONTENT_DIR/"

# Check if there are changes to commit
if git diff --staged --quiet; then
  echo "No changes to commit" >&2
else
  git commit -m "Update RSS feed GitHub Pages content [skip ci]"
  git push origin "$TARGET_BRANCH"
  echo "✓ GitHub Pages content committed and pushed to $TARGET_BRANCH" >&2
fi

# Switch back to original branch if needed
git checkout -
