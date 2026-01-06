#!/bin/bash
# Script to commit and push GitHub Pages content
# Usage: commit-github-pages.sh <content-directory> [target-branch]
# If target-branch is not specified or is "current", commits to current branch
# If target-branch is specified, commits to that branch

set -e

CONTENT_DIR="${1:-docs}"
TARGET_BRANCH="${2:-current}"

# Configure git
git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"

# If target branch is "current" or empty, just commit to current branch
if [ "$TARGET_BRANCH" = "current" ] || [ -z "$TARGET_BRANCH" ]; then
  echo "Committing to current branch" >&2
  
  # Add the content directory
  git add "$CONTENT_DIR/"
  
  # Check if there are changes to commit
  if git diff --staged --quiet; then
    echo "No changes to commit" >&2
  else
    git commit -m "Update RSS feed GitHub Pages content [skip ci]"
    git push
    echo "✓ GitHub Pages content committed and pushed" >&2
  fi
else
  # Commit to a different branch
  echo "Committing to branch: $TARGET_BRANCH" >&2
  
  # Save current branch
  CURRENT_BRANCH=$(git branch --show-current)
  
  # Save generated content to temp location before switching branches
  TEMP_DIR=$(mktemp -d)
  if [ -d "$CONTENT_DIR" ]; then
    echo "Saving generated content to temporary location" >&2
    cp -r "$CONTENT_DIR" "$TEMP_DIR/"
  fi
  
  # Fetch latest changes from origin
  git fetch origin
  
  # Check if target branch exists remotely
  if git ls-remote --heads origin "$TARGET_BRANCH" | grep -q "$TARGET_BRANCH"; then
    echo "Branch $TARGET_BRANCH exists remotely, fetching it" >&2
    git fetch origin "$TARGET_BRANCH:$TARGET_BRANCH" || true
  fi
  
  # Check if target branch exists locally
  if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
    echo "Switching to existing branch $TARGET_BRANCH" >&2
    git checkout "$TARGET_BRANCH"
  else
    echo "Creating new branch $TARGET_BRANCH from main" >&2
    git checkout -b "$TARGET_BRANCH" origin/main
  fi
  
  # Merge latest changes from main to keep github-pages branch up to date
  echo "Merging latest changes from main into $TARGET_BRANCH" >&2
  if git merge origin/main --no-edit -m "Merge main into $TARGET_BRANCH"; then
    echo "✓ Successfully merged main into $TARGET_BRANCH" >&2
  else
    echo "⚠ Merge from main had conflicts or was already up to date" >&2
  fi
  
  # Copy generated content back from temp location
  if [ -d "$TEMP_DIR/$CONTENT_DIR" ]; then
    echo "Restoring generated content from temporary location" >&2
    cp -r "$TEMP_DIR/$CONTENT_DIR"/* "$CONTENT_DIR/" 2>/dev/null || mkdir -p "$CONTENT_DIR"
    cp -r "$TEMP_DIR/$CONTENT_DIR"/* "$CONTENT_DIR/"
    rm -rf "$TEMP_DIR"
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
  
  # Switch back to original branch
  git checkout "$CURRENT_BRANCH"
fi
