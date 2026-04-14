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
	cp "$BATS_TEST_DIRNAME/../../.github/workflows/scripts/commit-github-pages.sh" "$TEST_DIR/"

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
	[ -f "$BATS_TEST_DIRNAME/../../.github/workflows/scripts/commit-github-pages.sh" ]
	[ -x "$BATS_TEST_DIRNAME/../../.github/workflows/scripts/commit-github-pages.sh" ]
}

@test "script validates content directory parameter" {
	cd "$TEST_DIR" || exit 1

	# Create docs directory with content
	mkdir -p docs
	echo "<html>test</html>" >docs/index.html

	git add docs/

	# Run script with docs directory
	run bash commit-github-pages.sh "docs" "current"

	# Check that script ran without error
	[ "$status" -eq 0 ]
}

@test "script detects when there are no changes to commit" {
	cd "$TEST_DIR" || exit 1

	# Create and commit docs directory
	mkdir -p docs
	echo "<html>test</html>" >docs/index.html
	git add docs/
	git commit -m "Add docs"

	# Run script when there are no changes
	run bash commit-github-pages.sh "docs" "current"

	# Check output contains "No changes to commit"
	[[ "$output" =~ "No changes to commit" ]]
}

@test "script configures git user" {
	cd "$TEST_DIR" || exit 1

	# Run script
	mkdir -p docs
	echo "<html>test</html>" >docs/index.html
	bash commit-github-pages.sh "docs" "current" 2>&1 || true

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

	# Create default docs directory
	mkdir -p docs
	echo "<html>test</html>" >docs/index.html

	# Run script without content directory parameter (should default to docs)
	run bash commit-github-pages.sh

	# Script should succeed
	[ "$status" -eq 0 ]
}

@test "script deploys preview content without overwriting production docs" {
	cd "$TEST_DIR" || exit 1

	mkdir -p docs
	echo "production" >docs/index.html
	echo "production summary" >docs/summary.html
	git add docs/
	git commit -m "Add production docs"
	git push origin main

	git checkout -b "feature/preview-path"

	echo "preview" >docs/index.html
	echo "preview summary" >docs/summary.html

	run bash commit-github-pages.sh "docs" "github-pages" "docs/preview/feature-preview-path"

	[ "$status" -eq 0 ]
	[ "$(git branch --show-current)" = "feature/preview-path" ]

	run git show github-pages:docs/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "production" ]

	run git show github-pages:docs/summary.html
	[ "$status" -eq 0 ]
	[ "$output" = "production summary" ]

	run git show github-pages:docs/preview/feature-preview-path/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview" ]

	run git show github-pages:docs/preview/feature-preview-path/summary.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview summary" ]
}

@test "script replaces stale preview files on redeploy" {
	cd "$TEST_DIR" || exit 1

	mkdir -p docs
	echo "preview v1" >docs/index.html
	echo "stale preview page" >docs/feed-old.html

	run bash commit-github-pages.sh "docs" "github-pages" "docs/preview/feature-preview-path"
	[ "$status" -eq 0 ]

	mkdir -p docs
	echo "preview v2" >docs/index.html
	rm -f docs/feed-old.html

	run bash commit-github-pages.sh "docs" "github-pages" "docs/preview/feature-preview-path"
	[ "$status" -eq 0 ]

	run git show github-pages:docs/preview/feature-preview-path/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview v2" ]

	run git cat-file -e github-pages:docs/preview/feature-preview-path/feed-old.html
	[ "$status" -ne 0 ]
}

@test "script supports nested preview deploys on the current branch" {
	cd "$TEST_DIR" || exit 1

	mkdir -p docs
	echo "preview current" >docs/index.html

	run bash commit-github-pages.sh "docs" "current" "docs/preview/feature-preview-path"

	[ "$status" -eq 0 ]

	run cat docs/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview current" ]

	run cat docs/preview/feature-preview-path/index.html
	[ "$status" -eq 0 ]
	[ "$output" = "preview current" ]
}

@test "script rejects deploy paths outside the content directory" {
	cd "$TEST_DIR" || exit 1

	mkdir -p docs
	echo "preview current" >docs/index.html

	run bash commit-github-pages.sh "docs" "current" "../outside"

	[ "$status" -ne 0 ]
	[[ "$output" =~ "cannot contain parent path segments" ]]
}
