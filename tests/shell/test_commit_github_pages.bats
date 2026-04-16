#!/usr/bin/env bats
# Tests for commit-github-pages.sh script
#
# This test file uses BATS (Bash Automated Testing System)
# Install with: npm install -g bats
# Run with: bats test_commit_github_pages.bats

setup() {
	# Create a temporary directory for testing
	TEST_DIR=$(mktemp -d)
	export TEST_DIR
	REMOTE_DIR=$(mktemp -d)
	export REMOTE_DIR

	# Copy the script to test directory
	cp "$BATS_TEST_DIRNAME/../../scripts/workflows/commit-github-pages.sh" "$TEST_DIR/"

	# Create a mock git repository
	cd "$TEST_DIR" || exit 1
	git init -b main
	git config user.email "test@example.com"
	git config user.name "Test User"

	# Create initial commit
	echo "# Test" >README.md
	git add README.md
	git commit -m "Initial commit"

	# Create and configure a bare remote so target-branch tests can fetch/push
	git init --bare --initial-branch=main "$REMOTE_DIR/origin.git"
	git remote add origin "$REMOTE_DIR/origin.git"
	git push -u origin main
}

teardown() {
	# Clean up test directory
	if [ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ]; then
		rm -rf "$TEST_DIR"
	fi

	if [ -n "$REMOTE_DIR" ] && [ -d "$REMOTE_DIR" ]; then
		rm -rf "$REMOTE_DIR"
	fi
}

@test "script exists and is executable" {
	[ -f "$BATS_TEST_DIRNAME/../../scripts/workflows/commit-github-pages.sh" ]
	[ -x "$BATS_TEST_DIRNAME/../../scripts/workflows/commit-github-pages.sh" ]
}

@test "script validates content directory parameter" {
	cd "$TEST_DIR" || exit 1

	# Create site directory with content
	mkdir -p site
	echo "<html>test</html>" >site/index.html

	git add site/

	# Run script with site directory
	run bash commit-github-pages.sh "site" "current"

	# Check that script ran without error
	[ "$status" -eq 0 ]
}

@test "script detects when there are no changes to commit" {
	cd "$TEST_DIR" || exit 1

	# Create and commit site directory
	mkdir -p site
	echo "<html>test</html>" >site/index.html
	git add site/
	git commit -m "Add site"

	# Run script when there are no changes
	run bash commit-github-pages.sh "site" "current"

	# Check output contains "No changes to commit"
	[[ "$output" =~ "No changes to commit" ]]
}

@test "script configures git user" {
	cd "$TEST_DIR" || exit 1

	# Run script
	mkdir -p site
	echo "<html>test</html>" >site/index.html
	bash commit-github-pages.sh "site" "current" 2>&1 || true

	# Verify git config was set
	local git_email
	git_email=$(git config --local user.email)
	[ "$git_email" = "github-actions[bot]@users.noreply.github.com" ]

	local git_name
	git_name=$(git config --local user.name)
	[ "$git_name" = "github-actions[bot]" ]
}

@test "script uses default content directory when not specified" {
	cd "$TEST_DIR" || exit 1

	# Create default site directory
	mkdir -p site
	echo "<html>test</html>" >site/index.html

	# Run script without content directory parameter (should default to site)
	run bash commit-github-pages.sh

	# Script should succeed
	[ "$status" -eq 0 ]
}

@test "script deploys preview content without overwriting production site" {
	cd "$TEST_DIR" || exit 1
	local preview_deploy_dir="site/preview/feature-preview-path"

	mkdir -p site
	echo "production" >site/index.html
	echo "production summary" >site/summary.html
	git add site/
	git commit -m "Add production site"
	git push origin main

	git checkout -b "feature/preview-path"

	echo "preview" >site/index.html
	echo "preview summary" >site/summary.html

	run bash commit-github-pages.sh "site" "github-pages" "$preview_deploy_dir"

	[ "$status" -eq 0 ]
	[ "$(git branch --show-current)" = "feature/preview-path" ]

	run git show github-pages:site/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "production" ]

	run git show github-pages:site/summary.html
	[ "$status" -eq 0 ]
	[ "$output" = "production summary" ]

	run git show "github-pages:$preview_deploy_dir/index.html"
	[ "$status" -eq 0 ]
	[ "$output" = "preview" ]

	run git show "github-pages:$preview_deploy_dir/summary.html"
	[ "$status" -eq 0 ]
	[ "$output" = "preview summary" ]
}

@test "script replaces stale preview files on redeploy" {
	cd "$TEST_DIR" || exit 1

	mkdir -p site
	echo "preview v1" >site/index.html
	echo "stale preview page" >site/feed-old.html

	run bash commit-github-pages.sh "site" "github-pages" "site/preview/feature-preview-path"
	[ "$status" -eq 0 ]

	mkdir -p site
	echo "preview v2" >site/index.html
	rm -f site/feed-old.html

	run bash commit-github-pages.sh "site" "github-pages" "site/preview/feature-preview-path"
	[ "$status" -eq 0 ]

	run git show github-pages:site/preview/feature-preview-path/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview v2" ]

	run git cat-file -e github-pages:site/preview/feature-preview-path/feed-old.html
	[ "$status" -ne 0 ]
}

@test "script supports nested preview deploys on the current branch" {
	cd "$TEST_DIR" || exit 1

	mkdir -p site
	echo "preview current" >site/index.html

	run bash commit-github-pages.sh "site" "current" "site/preview/feature-preview-path"

	[ "$status" -eq 0 ]

	run cat site/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview current" ]

	run cat site/preview/feature-preview-path/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview current" ]
}

@test "script rejects deploy paths outside the content directory" {
	cd "$TEST_DIR" || exit 1

	mkdir -p site
	echo "preview current" >site/index.html

	run bash commit-github-pages.sh "site" "current" "../outside"

	[ "$status" -ne 0 ]
	[[ "$output" =~ "cannot contain parent path segments" ]]
}

@test "production publish preserves existing preview directory on github-pages branch" {
	cd "$TEST_DIR" || exit 1

	# Set up github-pages branch with production content AND an existing preview
	mkdir -p site/preview/feature-branch
	echo "production v1" >site/index.html
	echo "preview content" >site/preview/feature-branch/index.html
	git add site/
	git commit -m "Add production and preview site"
	git push origin main

	# Now publish new production content (no preview directory in source)
	mkdir -p site
	echo "production v2" >site/index.html
	# Publish production content without a preview/ directory in the source
	# to verify that any existing previews on the target branch are preserved.

	run bash commit-github-pages.sh "site" "github-pages" "site"

	[ "$status" -eq 0 ]
	[ "$(git branch --show-current)" = "main" ]

	# Production content was updated
	run git show github-pages:site/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "production v2" ]

	# Existing preview content was NOT wiped by the production deploy
	run git show github-pages:site/preview/feature-branch/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview content" ]
}

@test "production publish removes preview directories missing from the manifest" {
	cd "$TEST_DIR" || exit 1

	mkdir -p site/preview/active-branch site/preview/stale-branch
	echo "production v1" >site/index.html
	echo "active preview" >site/preview/active-branch/index.html
	echo "stale preview" >site/preview/stale-branch/index.html
	cat <<'EOF' >site/preview/manifest.json
{
  "previews": [
    {
      "branch": "feature/active-branch",
      "slug": "active-branch",
      "url": "https://example.com/preview/active-branch/",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
EOF
	git add site/
	git commit -m "Add production and preview site"
	git push origin main

	echo "production v2" >site/index.html

	run bash commit-github-pages.sh "site" "github-pages" "site"

	[ "$status" -eq 0 ]

	run git show github-pages:site/preview/active-branch/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "active preview" ]

	run git cat-file -e github-pages:site/preview/stale-branch/index.html
	[ "$status" -ne 0 ]
}
