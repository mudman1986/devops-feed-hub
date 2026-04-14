#!/usr/bin/env bash
# Script to commit and push GitHub Pages content
# Usage: commit-github-pages.sh <content-directory> [target-branch] [deploy-directory]
# If target-branch is not specified or is "current", commits to current branch
# If deploy-directory is not specified, the content directory is used as-is
# If target-branch is specified, commits to that branch

set -euo pipefail

CONTENT_DIR="${1:-docs}"
TARGET_BRANCH="${2:-current}"
DEPLOY_DIR="${3:-$CONTENT_DIR}"

# Configure git for GitHub Actions bot
configure_git() {
	git config --local user.email "github-actions[bot]@users.noreply.github.com"
	git config --local user.name "github-actions[bot]"
}

# Validate deploy directory is safe and stays within the content directory tree
validate_deploy_dir() {
	local content_dir="$1"
	local deploy_dir="$2"

	if [ -z "$deploy_dir" ] || [ "$deploy_dir" = "." ] || [ "$deploy_dir" = "/" ]; then
		echo "Deploy directory cannot be empty, '.', or '/': $deploy_dir" >&2
		exit 1
	fi

	case "$deploy_dir" in
	../* | */../* | */..)
		echo "Deploy directory cannot contain parent path segments: $deploy_dir" >&2
		exit 1
		;;
	esac

	case "$deploy_dir" in
	"$content_dir" | "$content_dir"/*) ;;
	*)
		echo "Deploy directory must stay within $content_dir: $deploy_dir" >&2
		exit 1
		;;
	esac
}

# Sync generated content into the deploy directory
sync_content_files() {
	local source_dir="$1"
	local target_dir="$2"

	validate_deploy_dir "$CONTENT_DIR" "$target_dir"
	rm -rf "$target_dir"
	mkdir -p "$target_dir"
	cp -r "$source_dir"/. "$target_dir"/
}

# Copy content through a temporary directory so nested deploy paths are safe
sync_content_files_via_temp() {
	local source_dir="$1"
	local deploy_dir="$2"
	local temp_dir

	temp_dir=$(mktemp -d)
	trap 'rm -rf -- "$temp_dir"' RETURN
	cp -r "$source_dir" "$temp_dir/"
	sync_content_files "$temp_dir/$(basename "$source_dir")" "$deploy_dir"
}

# Add deploy directory and force-add generated files
add_content_files() {
	local deploy_dir="$1"

	# Add the deploy directory
	git add -f -A "$deploy_dir/"
}

# Commit and push if there are changes
commit_and_push() {
	local branch_name="$1"
	local branch_display="${branch_name:-current branch}"

	# Check if there are changes to commit
	if git diff --staged --quiet; then
		echo "No changes to commit" >&2
		return 0
	fi

	git commit -m "Update RSS feed GitHub Pages content [skip ci]"

	# Push only if we have a remote configured
	if git remote get-url origin >/dev/null 2>&1; then
		if [ -n "$branch_name" ]; then
			git push origin "$branch_name"
		else
			git push
		fi
		echo "✓ GitHub Pages content committed and pushed to $branch_display" >&2
	else
		echo "✓ GitHub Pages content committed to $branch_display (no remote configured)" >&2
	fi
}

# Main execution
configure_git

# If target branch is "current" or empty, just commit to current branch
if [ "$TARGET_BRANCH" = "current" ] || [ -z "$TARGET_BRANCH" ]; then
	echo "Committing to current branch" >&2
	if [ "$DEPLOY_DIR" != "$CONTENT_DIR" ]; then
		sync_content_files_via_temp "$CONTENT_DIR" "$DEPLOY_DIR"
	fi
	add_content_files "$DEPLOY_DIR"
	commit_and_push ""
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
		# Clean up uncommitted and untracked changes in working directory to allow branch switch
		git reset --hard HEAD
		git clean -fd "$CONTENT_DIR"
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
		sync_content_files "$TEMP_DIR/$CONTENT_DIR" "$DEPLOY_DIR"
		rm -rf "$TEMP_DIR"
	fi

	add_content_files "$DEPLOY_DIR"
	commit_and_push "$TARGET_BRANCH"

	# Switch back to original branch
	git checkout "$CURRENT_BRANCH"
fi
