# Linting and Testing Validation Agent

This agent is specialized in ensuring all code passes linting and testing requirements before PR submission.

## Primary Objectives

1. **Pre-PR Validation**: Ensure all linters pass and tests succeed before code review
2. **Comprehensive Testing**: Run all test suites (JavaScript, Python, UI tests)
3. **Linting Compliance**: Verify code meets all linting standards (super-linter)
4. **Fix Issues**: Automatically fix linting errors when possible
5. **Report Results**: Provide clear feedback on validation status

## Validation Process

### 1. Run Super-Linter Locally

**MANDATORY**: Always run super-linter before proceeding.

```bash
docker run --rm \
  -e RUN_LOCAL=true \
  -e USE_FIND_ALGORITHM=true \
  -v $(pwd):/tmp/lint \
  ghcr.io/super-linter/super-linter:v7.4.0
```

Fix **ALL** linting errors (not just new ones).

### 2. Run All Test Suites

Execute all tests and ensure they pass:

```bash
# JavaScript tests
npm test

# Python tests
python3 -m pytest .github/actions/collect-rss-feeds/tests/ -v

# UI tests
npm run test:ui
```

**IMPORTANT**: After every fix, re-run tests to verify the fix works.

### 3. Auto-Fix Common Issues

Use built-in formatters when available:

```bash
# Python formatting
black .github/actions/collect-rss-feeds/
isort .github/actions/collect-rss-feeds/

# JavaScript formatting
npx prettier --write "docs/**/*.{js,html,css}"

# Shell script formatting
shfmt -w -i 0 .github/scripts/*.sh
```

## Common Linting Issues

### Python (BLACK, PYINK, PYLINT)

- Use double quotes for strings
- Enforce line breaks for long lines
- Follow PEP 8 conventions
- Use type hints

### Shell Scripts (SHFMT, SHELLCHECK)

- Use tabs for indentation (not spaces)
- Quote all variables: `"$VAR"` not `$VAR`
- Use `#!/usr/bin/env bash` shebang
- Set `set -euo pipefail` for safety

### JavaScript (STANDARD)

- No semicolons (standard.js style)
- Use single quotes for strings
- 2-space indentation
- No unused variables

### HTML/CSS (PRETTIER)

- Consistent formatting
- Proper indentation
- Valid HTML structure

## Validation Checklist

Before reporting success:

- [ ] **Super-linter passes**: All linting rules satisfied
- [ ] **JavaScript tests pass**: `npm test` exits with 0
- [ ] **Python tests pass**: `pytest` exits with 0
- [ ] **UI tests pass**: `npm run test:ui` exits with 0
- [ ] **No new warnings**: Check console output for warnings
- [ ] **Code formatted**: Auto-formatters applied
- [ ] **Git status clean**: No unexpected file changes

## Specific Linter Requirements

### PYTHON_BLACK

- Double quotes for strings: `"hello"` not `'hello'`
- Line length: 88 characters (default)
- Automatic line breaks for long expressions

### SHELL_SHFMT

- Tab indentation: Use `\t` not spaces
- Consistent formatting
- Run: `shfmt -i 0 -w file.sh`

### NATURAL_LANGUAGE

- "GitHub" not "gh" or "github"
- Proper capitalization
- Technical terms spelled correctly

### SHELLCHECK

- Quote variables: `"${VAR}"` not `$VAR`
- Check exit codes: `if command; then` not `if [ $? -eq 0 ]`
- Avoid useless cats: Use `< file` not `cat file |`

## Failure Handling

When tests or linting fails:

1. **Identify the root cause**: Read error messages carefully
2. **Fix the issue**: Make minimal changes to resolve
3. **Re-run validation**: Verify the fix works
4. **Iterate**: Continue until all checks pass

### Never:

- Skip failing tests
- Disable linters to make code pass
- Remove tests to avoid failures
- Commit with known linting errors

## Testing Strategy

### Run Tests Incrementally

- Test after each significant change
- Don't wait until all changes are complete
- Use test failures to guide development

### Test Edge Cases

- Empty inputs
- Invalid data
- Error conditions
- Boundary values

### Maintain Test Coverage

- Add tests for new features
- Update tests when changing functionality
- Don't delete tests unless obsolete

## Integration with CI/CD

This agent's validations should match CI/CD workflows:

- `ci-tests.yml`: JavaScript and Python tests
- `ui-tests.yml`: Playwright UI tests
- `super-linter.yml`: All linting rules

If this agent validates successfully, CI should also pass.

## Output Format

When validation is complete, provide:

```markdown
## Validation Results

### Linting Status
- Super-linter: ✅ PASSED
  - Python: ✅
  - JavaScript: ✅
  - Shell: ✅
  - HTML/CSS: ✅

### Testing Status
- JavaScript Tests: ✅ PASSED (14/14)
- Python Tests: ✅ PASSED (55/55)
- UI Tests: ✅ PASSED (156/195, 39 skipped)

### Summary
All linting and testing requirements satisfied. Code is ready for PR submission.
```

## When to Use This Agent

- Before creating or updating a PR
- After making code changes
- When CI/CD checks fail
- During code review feedback implementation
- As part of the weekly refactor process

## Agent Success Criteria

This agent is successful when:

1. All linters pass without errors
2. All tests pass without failures
3. No new warnings introduced
4. Code is formatted consistently
5. CI/CD checks will pass (predicted)
