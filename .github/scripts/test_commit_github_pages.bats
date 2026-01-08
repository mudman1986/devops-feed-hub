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

	# Copy the script to test directory
	cp "$BATS_TEST_DIRNAME/../../scripts/commit-github-pages.sh" "$TEST_DIR/"

	# Create a mock git repository
	cd "$TEST_DIR" || exit 1
	git init
	git config user.email "test@example.com"
	git config user.name "Test User"

	# Create initial commit
	echo "# Test">README.md
	git add README.md
	git commit -m "Initial commit"
}

teardown() {
	# Clean up test directory
	if [ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ]; then
	    rm -rf "$TEST_DIR"
	fi
}

@test "script exists and is executable" {
	[ -f "$BATS_TEST_DIRNAME/../../scripts/commit-github-pages.sh" ]
	[ -x "$BATS_TEST_DIRNAME/../../scripts/commit-github-pages.sh" ]
}

@test "script validates content directory parameter" {
	cd "$TEST_DIR" || exit 1

	# Create docs directory with content
	mkdir -p docs
	echo "<html>test</html>">docs/index.html

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
	echo "<html>test</html>">docs/index.html
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
	echo "<html>test</html>">docs/index.html
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
	echo "<html>test</html>">docs/index.html

	# Run script without content directory parameter (should default to docs)
	run bash commit-github-pages.sh

	# Script should succeed
	[ "$status" -eq 0 ]
}
