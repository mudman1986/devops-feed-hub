# Scripts

This directory contains utility scripts organized by purpose.

## Directory Structure

### test/

Test utilities and helpers used during development and CI/CD.

**Scripts**:
- `generate-test-data.sh` - Generates HTML test fixtures for UI tests
- `test_commit_github_pages.bats` - BATS tests for the GitHub Pages commit script

**Usage**:
```bash
# Generate test data for UI tests
bash scripts/test/generate-test-data.sh

# Run BATS tests
bats scripts/test/test_*.bats
```

## Guidelines

- **Test scripts**: Place all test utilities in `scripts/test/`
- **Shell scripts**: Follow shell script best practices (see `.github/instructions/shell-scripts.instructions.md`)
- **Testing**: All scripts should have corresponding BATS tests
