# Pull Request

## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 bugfix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 UI/UX improvement
- [ ] ♻️ Code refactoring
- [ ] ➕ RSS feed addition
- [ ] ✅ Test improvement

## Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #(issue number)

## Changes Made

<!-- List the specific changes made in this PR -->

-
-
-

## Testing Checklist

<!-- Verify all applicable tests have been run and pass -->

### For ALL Changes

- [ ] ✅ JavaScript unit tests pass (`npm test`)
- [ ] ✅ Super-linter passes locally (see CONTRIBUTING.md for command)
- [ ] ✅ No new security vulnerabilities introduced
- [ ] ✅ Code follows existing patterns and style guidelines

### For Python Changes

- [ ] ✅ Python tests pass (`python3 -m pytest .github/workflows/scripts/rss-processing/tests/ -v`)
- [ ] ✅ Type hints added for function parameters and return values
- [ ] ✅ Docstrings added for functions and classes

### For Shell Script Changes

- [ ] ✅ Shell script tests pass (`bats .github/scripts/test_*.bats`)
- [ ] ✅ Scripts use tabs for indentation
- [ ] ✅ All variables are properly quoted

### For UI Changes (CRITICAL)

- [ ] ✅ Test data generated (`bash .github/scripts/generate-test-data.sh`)
- [ ] ✅ UI tests pass (`npm run test:ui`)
- [ ] ✅ Tested on desktop (1920x1080, 1366x768)
- [ ] ✅ Tested on tablet (768x1024)
- [ ] ✅ Tested on mobile (375x667, 414x896)
- [ ] ✅ Light theme works correctly
- [ ] ✅ Dark theme works correctly
- [ ] ✅ Accessibility verified (ARIA labels, keyboard navigation)
- [ ] ✅ Screenshots attached below

### For Workflow Changes

- [ ] ✅ Workflow syntax is valid
- [ ] ✅ Workflow has been tested and executes successfully
- [ ] ✅ Uses minimal required permissions
- [ ] ✅ No hardcoded secrets or sensitive data

## Quality Checklist

<!-- Ensure high-quality code standards -->

- [ ] ✅ Added tests for new features or bugfixes
- [ ] ✅ Updated documentation (if applicable)
- [ ] ✅ No code duplication introduced
- [ ] ✅ Error handling is appropriate
- [ ] ✅ Commit messages are clear and descriptive
- [ ] ✅ Changes are minimal and focused

## Screenshots

<!-- For UI changes, include before/after screenshots -->
<!-- For feature additions, include screenshots demonstrating the new functionality -->

### Before

<!-- Screenshot or description of current state -->

### After

<!-- Screenshot or description of new state -->

## Additional Notes

<!-- Any additional context, implementation details, or notes for reviewers -->

## Reviewer Checklist

<!-- For maintainers reviewing this PR -->

- [ ] Code follows project conventions
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] CI checks pass
