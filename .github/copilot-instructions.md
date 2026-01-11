# Copilot Instructions for DevOps Feed Hub Repository

## Overview

This repository is maintained primarily by GitHub Copilot. Path-specific instructions exist for specialized contexts:

- **Python RSS Action Code**: `.github/instructions/python-rss-action.instructions.md`
- **Workflow YAML Files**: `.github/instructions/workflows.instructions.md`
- **Shell Scripts**: `.github/instructions/shell-scripts.instructions.md`
- **Frontend/UI Code**: `.github/instructions/frontend-ui.instructions.md`
- **UI Test Files**: `.github/instructions/ui-testing.instructions.md`
- **Code Review**: `.github/instructions/code-review.instructions.md`

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
- All tests must pass before committing

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
    -e FIX_PYTHON_BLACK=true \
    -e FIX_PYTHON_ISORT=true \
    -e FIX_SHELL_SHFMT=true \
    -e FIX_MARKDOWN_PRETTIER=true \
    -e FIX_YAML_PRETTIER=true \
    -e FIX_JAVASCRIPT_PRETTIER=true \
    -e FIX_CSS_PRETTIER=true \
    -e FIX_HTML_PRETTIER=true \
    -e FIX_NATURAL_LANGUAGE=true \
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

- **JavaScript**: `npm test` (all tests must pass)
- **Python**: `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v` (all tests must pass)
- **UI Tests**: `npm run test:ui`
  - **IMPORTANT**: UI tests require generated HTML files. Run `bash .github/scripts/generate-test-data.sh` first
- **Shell Scripts**: `bats .github/scripts/test_*.bats`

### Environment Setup

- Update `.github/workflows/copilot-setup-steps.yml` when you need to install dependencies
- This ensures a consistent, ready-to-code environment for all Copilot sessions

## Pre-Completion Checklist

Before completing any task and presenting work as finished, verify:

- [ ] **All tests pass**: JavaScript, Python, UI tests, shell script tests
  - **MANDATORY: Run tests after every fix to verify** - Never assume a fix works
  - Run `npm test` for JavaScript tests
  - Run `python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v` for Python
  - Run `npm run test:ui` for Playwright tests
  - Fix failures immediately and rerun until all pass
- [ ] **Bugfixes require test-driven approach**:
  - **ALWAYS assign bugs to test-runner agent first**
  - Test agent will create failing test → fix bug → verify test passes
  - This ensures bugs are properly reproduced and fixed
- [ ] **Use test-runner and ui-specialist agents**: Before committing, use specialized agents to verify your work
  - Use `test-runner` agent to run all linters and tests
  - Use `ui-specialist` agent to review UI changes for responsiveness and accessibility
  - Address any issues found by these agents before committing
- [ ] **Super-linter passes**: Run locally and fix ALL linting errors
- [ ] **Security scan passes**: No new vulnerabilities introduced
- [ ] **Code quality improved**: Refactored code, eliminated duplication
- [ ] **Tests added**: New features and bugfixes have test coverage
- [ ] **UI validated** (if applicable): Tested on desktop, tablet, and mobile
- [ ] **Workflows verified** (if applicable): All affected workflows execute successfully
- [ ] **Documentation updated** (if needed): Inline comments and minimal docs
- [ ] **No secrets committed**: No hardcoded credentials or sensitive data
- [ ] **Changes are minimal**: Smallest possible changes to achieve the goal
- [ ] **Code review requested**: Use code review tool before finalizing
- [ ] **All issues resolved**: No new linting, security, or test failures

## Repository Structure

### Key Directories

- `.github/actions/` - Composite actions (e.g., RSS feed collector)
- `.github/workflows/` - GitHub Actions workflows
- `.github/scripts/` - Shell scripts used by workflows
- `docs/` - GitHub Pages content (HTML, CSS, JavaScript)
- `tests/` - Playwright UI tests
- `.github/agents/` - Custom agent instructions (read-only)

### Important Files

- `.github/rss-feeds.json` - RSS feed configuration
- `.github/workflows/copilot-setup-steps.yml` - Environment setup automation
- `package.json` - JavaScript dependencies and test scripts
- `pyproject.toml` - Python project configuration
- `playwright.config.js` - UI test configuration
