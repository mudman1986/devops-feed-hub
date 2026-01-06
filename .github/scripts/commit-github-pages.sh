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
  
  # Stash any uncommitted changes (like generated docs) before switching branches
  STASHED=0
  if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "Stashing uncommitted changes before branch switch" >&2
    git stash push -m "Temporary stash for branch switch"
    STASHED=1
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
  
  # Apply stashed changes if we stashed them
  if [ $STASHED -eq 1 ]; then
    echo "Applying stashed changes" >&2
    git stash pop
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
