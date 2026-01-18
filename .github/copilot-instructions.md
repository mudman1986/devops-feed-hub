# Copilot Instructions for DevOps Feed Hub Repository

## Overview

**This is a site project** - The DevOps Feed Hub is a user-facing web application that displays RSS feeds. UI quality and functionality are critical to success.

This repository is maintained primarily by GitHub Copilot. Path-specific instructions exist for specialized contexts:

- **Python RSS Action Code**: `.github/instructions/python-rss-action.instructions.md`
- **Workflow YAML Files**: `.github/instructions/workflows.instructions.md`
- **Shell Scripts**: `.github/instructions/shell-scripts.instructions.md`
- **Frontend/UI Code**: `.github/instructions/frontend-ui.instructions.md`
- **UI Test Files**: `.github/instructions/ui-testing.instructions.md`
- **Code Review**: `.github/instructions/code-review.instructions.md`

## Critical Project Context

**THIS IS A site PROJECT** - All changes must be validated through UI tests before being considered complete. The primary deliverable is a functioning site displayed in a browser. Any change that affects:

- HTML structure
- CSS styling
- JavaScript functionality
- Theme switching
- View modes (list/card)
- Mobile responsiveness
- Navigation
- Accessibility features

...MUST be validated with UI tests before committing.

## Core Principles

### Fix All Issues, Leave Code Better

- Fix **ALL** linting errors before committing, not just those you introduced
- Proactively address security vulnerabilities and code quality issues throughout the codebase
- Leave the codebase in a better state than you found it

### Continuous Refactoring

- Actively look for opportunities to refactor and improve existing code
- Avoid patch-over-patch mentality - refactor underlying structure
- Favor clean, maintainable solutions over quick fixes
- Address technical debt proactively

### Code Quality Standards

- **Use open source packages** when available instead of custom code
- **Keep code DRY**: Extract common functionality into reusable modules
- **Modular design**: Single-purpose functions and focused modules
- **Prefer scripts**: Use separate script files instead of inline workflow code
- **Self-documenting code**: Write clear code with minimal extensive documentation

### Testing Requirements

- **MANDATORY: Add tests for all new features and bugfixes**
- Test edge cases, error conditions, and critical paths
- Update existing tests when modifying functionality
- **CRITICAL: All tests must pass before committing** - PRs with failing tests will not be merged
- **Never stop working if there are failed tests** - continue until all tests pass
- **Do NOT commit status reports or progress tracking files** - No Markdown files documenting your work progress, test results, or planning. Useful documentation (readme updates, component docs) is fine and should be committed.

## Agent Integration Requirement

### Coordination with Specialized Agents

- **MANDATORY: For every task, the coding agent MUST assign tasks to all available specialized agents in the repository (e.g., UI/UX Specialist, Test Runner, Code Review, etc.) alongside performing its own work.**
- The coding agent is responsible not only for completing its assigned coding or refactoring, but also for ensuring that all relevant agents are engaged to apply their expertise for each change (for example: test runner validates tests and coverage, UI specialist reviews and iterates on UI/UX, etc.).
- Assignment to specialized agents must happen automatically as part of the workflow for every new task, regardless of perceived necessity.
- This ensures that every pull request or significant code change receives focused review and validation from all aspects: UI/UX, testing/coverage, accessibility, code linting, and documentation, according to agent roles.

## Local Development and Validation

### Running Super-Linter Locally

- **MANDATORY: Always run super-linter locally** before pushing changes
- Run using Docker to match CI environment with autofix enabled:
  ```bash
  docker run --rm \
    -e RUN_LOCAL=true \
    -e VALIDATE_ALL_CODEBASE=true \
    -e FAIL_ON_CONFLICTING_TOOLS_ENABLED= true \
    -e DEFAULT_BRANCH=main \
    -e IGNORE_GITIGNORED_FILES=true \
    -e SAVE_SUPER_LINTER_SUMMARY=true \
    -e VALIDATE_BASH=true \
    -e VALIDATE_BASH_EXEC=true \
    -e VALIDATE_SHELL_SHFMT=true \
    -e VALIDATE_PYTHON_BLACK=true \
    -e VALIDATE_PYTHON_ISORT=true \
    -e VALIDATE_PYTHON_PYLINT=true \
    -e VALIDATE_PYTHON_FLAKE8=true \
    -e VALIDATE_PYTHON_MYPY=true \
    -e VALIDATE_JAVASCRIPT_ES=true \
    -e VALIDATE_JAVASCRIPT_PRETTIER=true \
    -e VALIDATE_CSS=true \
    -e VALIDATE_CSS_PRETTIER=true \
    -e VALIDATE_HTML=true \
    -e VALIDATE_HTML_PRETTIER=true \
    -e VALIDATE_JSON=true \
    -e VALIDATE_JSON_PRETTIER=true \
    -e VALIDATE_YAML=true \
    -e VALIDATE_YAML_PRETTIER=true \
    -e VALIDATE_MARKDOWN=true \
    -e VALIDATE_MARKDOWN_PRETTIER=true \
    -e VALIDATE_NATURAL_LANGUAGE=true \
    -e VALIDATE_GITHUB_ACTIONS=true \
    -e VALIDATE_GITLEAKS=true \
    -e VALIDATE_GIT_MERGE_CONFLICT_MARKERS=true \
    -e FIX_CSS=true \
    -e FIX_PYTHON_BLACK=true \
    -e FIX_PYTHON_ISORT=true \
    -e FIX_SHELL_SHFMT=true \
    -e FIX_MARKDOWN=true \
    -e FIX_MARKDOWN_PRETTIER=true \
    -e FIX_YAML_PRETTIER=true \
    -e FIX_JAVASCRIPT_PRETTIER=true \
    -e FIX_CSS_PRETTIER=true \
    -e FIX_HTML_PRETTIER=true \
    -e FIX_NATURAL_LANGUAGE=true \
    -e FIX_JAVASCRIPT_ES=true \
    -v $(pwd):/tmp/lint \
    ghcr.io/super-linter/super-linter:v8.3.2
  ```
- **IMPORTANT: Keep running super-linter and fixing errors until it reports "Successfully linted" with no errors**
- **DO NOT use USE_FIND_ALGORITHM** - it's incompatible with VALIDATE_ALL_CODEBASE
- **Always use VALIDATE_ALL_CODEBASE=true** to lint the entire codebase
- **Always use DEFAULT_BRANCH=main** for this repository
- **Always use IGNORE_GITIGNORED_FILES=true** to respect .gitignore
- **Always use SAVE_SUPER_LINTER_SUMMARY=true** to generate summary reports
- **Enable all FIX\_\* flags** to automatically fix formatting issues
- **Linter configs**: All linter configuration files are in `.github/linters/`
- Fix **ALL** remaining linting errors before committing (not just errors you introduced)

### Running Tests

**CRITICAL FOR site PROJECT**: UI tests are the primary validation mechanism. They MUST pass before any work is considered complete.

#### Test Execution Order (MANDATORY)

1. **UI Tests** (PRIMARY - MOST IMPORTANT)
   - **ALWAYS run FIRST after any UI change**
   - **Generate test data**: `bash scripts/test/generate-test-data.sh`
   - **Run UI tests**: `npm run test:ui`
   - **CRITICAL**: These tests validate the actual site functionality
   - **Fix ALL failures immediately** - UI test failures mean the site is broken
   - **Test specific files**: `npx playwright test tests/ui/view-modes.spec.js` for targeted validation

2. **JavaScript Unit Tests** (REQUIRED)
   - Run: `npm test`
   - All tests must pass

3. **Python Tests** (REQUIRED)
   - Run: `python3 -m pytest actions/collect-rss-feeds/tests/ -v`
   - All tests must pass

4. **Shell Script Tests** (REQUIRED)
   - Run: `bats scripts/test/test_*.bats`
   - All tests must pass

#### UI Testing Requirements

**BEFORE making any changes that affect the site:**

1. Generate test HTML: `bash scripts/test/generate-test-data.sh`
2. Run baseline UI tests to ensure they pass: `npm run test:ui`

**AFTER making any changes that affect the site:**

1. Regenerate test HTML: `bash scripts/test/generate-test-data.sh`
2. Run UI tests: `npm run test:ui`
3. Fix ALL failures immediately
4. Re-run until 100% pass
5. Take screenshots to verify visual correctness

**NEVER commit changes without verifying UI tests pass.** This is a site - if the UI tests fail, the site is broken.

### Environment Setup

- Update `.github/workflows/copilot-setup-steps.yml` when you need to install dependencies
- This ensures a consistent, ready-to-code environment for all Copilot sessions

## Pre-Completion Checklist

Before completing any task and presenting work as finished, verify **IN THIS ORDER**:

### 1. UI Tests (HIGHEST PRIORITY - site PROJECT)

- [ ] **UI tests MUST pass FIRST** - This validates the actual site works
  - Generate test data: `bash scripts/test/generate-test-data.sh`
  - Run UI tests: `npm run test:ui`
  - **ALL UI tests must pass** - No exceptions
  - Take screenshots to verify visual correctness
  - Test on multiple viewports (desktop, tablet, mobile)
  - If ANY UI test fails, fix immediately and re-run

### 2. Other Tests (All Must Pass)

- [ ] **JavaScript tests pass**: `npm test`
- [ ] **Python tests pass**: `python3 -m pytest actions/collect-rss-feeds/tests/ -v`
- [ ] **Shell script tests pass**: `bats scripts/test/test_*.bats`
- [ ] **MANDATORY: Run tests after every fix to verify** - Never assume a fix works

### 3. Code Quality & Security

- [ ] **Super-linter passes**: Run locally and fix ALL linting errors
- [ ] **Security scan passes**: No new vulnerabilities introduced
- [ ] **Code quality improved**: Refactored code, eliminated duplication
- [ ] **Tests added**: New features and bugfixes have test coverage

### 4. Specialized Agent Validation

- [ ] **Bugfixes require test-driven approach**:
  - **ALWAYS assign bugs to test-runner agent first**
  - Test agent will create failing test → fix bug → verify test passes
  - This ensures bugs are properly reproduced and fixed
- [ ] **Use test-runner and ui-specialist agents**: Before committing, use specialized agents to verify your work
  - Use `test-runner` agent to run all linters and tests
  - Use `ui-specialist` agent to review UI changes for responsiveness and accessibility
  - Address any issues found by these agents before committing

### 5. Final Validation

- [ ] **UI validated on all devices**: Tested on desktop (1920x1080, 1366x768), tablet (768x1024), and mobile (375x667, 414x896)
- [ ] **Workflows verified** (if applicable): All affected workflows execute successfully
- [ ] **Documentation updated** (if needed): Inline comments and minimal docs
- [ ] **No secrets committed**: No hardcoded credentials or sensitive data
- [ ] **Changes are minimal**: Smallest possible changes to achieve the goal
- [ ] **Code review requested**: Use code review tool before finalizing
- [ ] **All issues resolved**: No new linting, security, or test failures

## ⚠️ CRITICAL REMINDER FOR site PROJECT

**Before marking ANY task complete:**

1. ✅ UI tests MUST pass (this validates the site works)
2. ✅ Visual verification with screenshots (confirm it looks correct)
3. ✅ All other tests pass
4. ✅ Super-linter passes

**If UI tests fail, the site is broken - the task is NOT complete.**

## Repository Structure

### Key Directories

- `actions/` - Reusable composite actions (e.g., RSS feed collector)
- `.github/workflows/` - GitHub Actions workflows
- `.github/workflows/scripts/` - Scripts used by workflows
- `scripts/test/` - Test utilities and helpers
- `docs/` - GitHub Pages content (HTML, CSS, JavaScript)
- `tests/` - Playwright UI tests
- `.github/agents/` - Custom agent instructions (read-only)

### Important Files

- `.github/rss-feeds.json` - RSS feed configuration
- `.github/workflows/copilot-setup-steps.yml` - Environment setup automation
- `package.json` - JavaScript dependencies and test scripts
- `pyproject.toml` - Python project configuration
- `playwright.config.js` - UI test configuration
