---
applyTo: "**"
excludeAgent: "coding-agent"
---

# Copilot Code Review Instructions

Instructions for code review tasks in the DevOps Feed Hub repository.

## Code Review Focus Areas

### Code Quality

- **Readability**: Code should be clear and self-documenting
- **Maintainability**: Look for opportunities to refactor and simplify
- **DRY violations**: Identify and suggest eliminating code duplication
- **Naming**: Verify descriptive, consistent naming conventions
- **Comments**: Ensure complex logic has clear inline comments
- **Error handling**: Check for proper exception handling and error messages

### Security

- **Secrets**: Verify no hardcoded credentials or sensitive data
- **Input validation**: Check for proper input validation and sanitization
- **Dependencies**: Review new dependencies for security vulnerabilities
- **Permissions**: Ensure minimal required permissions in workflows
- **Shell scripts**: Verify proper variable quoting and shellcheck compliance

### Testing

- **Test coverage**: New features and bugfixes must have tests
- **Test quality**: Tests should cover edge cases and error conditions
- **Test isolation**: Tests should be independent and not rely on execution order
- **Mock external dependencies**: Tests should not make real external HTTP requests

### Performance

- **Efficiency**: Look for performance bottlenecks
- **Resource usage**: Check for memory leaks or excessive resource consumption
- **Optimization opportunities**: Suggest improvements without sacrificing readability

### Standards Compliance

- **Python**: PEP 8, type hints, docstrings
- **JavaScript**: ES6+, consistent style
- **Shell scripts**: shellcheck compliance, proper quoting, tabs for indentation
- **Workflows**: Clear naming, proper triggers, minimal permissions
- **Super-linter**: All code must pass super-linter validation before committing

#### Super-Linter Validation

**MANDATORY: Always run super-linter locally before pushing changes**

Run super-linter to validate all code in the repository:

```bash
docker run --rm \
  -e RUN_LOCAL=true \
  -e USE_FIND_ALGORITHM=true \
  -e VALIDATE_ALL_CODEBASE=true \
  -v $(pwd):/tmp/lint \
  ghcr.io/super-linter/super-linter:latest
```

**IMPORTANT:** Always set `VALIDATE_ALL_CODEBASE=true` to ensure comprehensive validation.

#### Super-Linter autofix

Use autofix mode to automatically correct linting errors:

```bash
docker run --rm \
  -e RUN_LOCAL=true \
  -e USE_FIND_ALGORITHM=true \
  -e VALIDATE_ALL_CODEBASE=true \
  -e FIX_PYTHON_BLACK=true \
  -e FIX_PYTHON_ISORT=true \
  -e FIX_SHELL_SHFMT=true \
  -e FIX_MARKDOWN_PRETTIER=true \
  -e FIX_YAML_PRETTIER=true \
  -e FIX_JAVASCRIPT_PRETTIER=true \
  -e FIX_CSS_PRETTIER=true \
  -e FIX_HTML_PRETTIER=true \
  -v $(pwd):/tmp/lint \
  ghcr.io/super-linter/super-linter:latest
```

Common FIX\_ variables:

- `FIX_PYTHON_BLACK=true` - autoformat Python with Black
- `FIX_PYTHON_ISORT=true` - autosort Python imports
- `FIX_SHELL_SHFMT=true` - autoformat shell scripts (tabs for indentation)
- `FIX_MARKDOWN_PRETTIER=true` - autoformat Markdown
- `FIX_YAML_PRETTIER=true` - autoformat YAML
- `FIX_JAVASCRIPT_PRETTIER=true` - autoformat JavaScript
- `FIX_CSS_PRETTIER=true` - autoformat CSS
- `FIX_HTML_PRETTIER=true` - autoformat HTML

## Review Checklist

When reviewing code changes, verify:

- [ ] Code follows language-specific style guidelines
- [ ] No hardcoded secrets or sensitive data
- [ ] Proper error handling throughout
- [ ] Tests added for new functionality or bugfixes
- [ ] All tests pass
- [ ] **Super-linter passes with VALIDATE_ALL_CODEBASE=true** (run locally before pushing)
- [ ] All linting errors fixed (use autofix mode when possible)
- [ ] No new security vulnerabilities introduced
- [ ] Documentation updated if needed
- [ ] No unnecessary code duplication
- [ ] Changes are minimal and focused
- [ ] UI changes tested on multiple screen sizes (if applicable)
- [ ] Workflows verified to execute successfully (if applicable)

## Common Issues to Watch For

### Python Code

- Missing type hints
- Missing or incomplete docstrings
- Improper exception handling
- Not using context managers for file operations
- Violating PEP 8 style guidelines

### JavaScript Code

- Missing error handling
- Not cleaning up localStorage or state
- Missing accessibility attributes
- Poor responsive design
- Missing unit tests for new functionality

### Shell Scripts

- Unquoted variables (`$VAR` instead of `"$VAR"`)
- Missing error handling (`set -euo pipefail`)
- Using spaces instead of tabs for indentation
- Not handling edge cases or invalid inputs

### GitHub Workflows

- Inline bash instead of separate scripts
- Overly broad permissions
- Missing error handling
- Hardcoded values instead of variables
- Not verifying workflow execution after changes

### General

- Code duplication across files
- Overly complex functions that should be broken down
- Missing or outdated documentation
- Not following project conventions
- Introducing breaking changes without justification

## Feedback Guidelines

- Be constructive and specific
- Suggest improvements with examples
- Prioritize critical issues (security, bugs) over style preferences
- Acknowledge good practices and improvements
- Focus on the most impactful changes
