---
applyTo: "docs/**/*.js,docs/**/*.html,docs/**/*.css"
---

# Frontend/UI Development

**CRITICAL**: This project generates a user-facing site. All UI changes must be validated with UI tests.

## Testing Requirements (MANDATORY)

### Before Making Changes

1. Generate test data: `bash scripts/test/generate-test-data.sh`
2. Run baseline tests: `npm run test:ui`
3. Ensure all tests pass before starting

### After Making Changes

1. Regenerate test data: `bash scripts/test/generate-test-data.sh`
2. Run UI tests: `npm run test:ui`
3. Fix ALL failures immediately
4. Run Jest unit tests: `npm test`
5. Take screenshots to verify visual correctness

### Test Coverage Requirements

- Write Jest unit tests for JavaScript logic: `npm test`
- Write Playwright UI tests in `tests/ui/` for visual/interaction changes
- Test all device configurations (desktop, tablet, mobile)
- Test all view modes (list, card)
- Test all themes (light, dark, experimental)

## JavaScript

- Use modern ES6+ syntax
- Use localStorage for client-side persistence
- Handle errors gracefully
- Avoid syntax errors - validate with `node -c filename.js`

## Responsive Design

- **MANDATORY: Test on multiple screen sizes**
  - Desktop: 1920x1080, 1366x768
  - Tablet: 768x1024
  - Mobile: 375x667, 414x896
- Touch targets minimum 44x44px (desktop), 48x48px (mobile)
- Test navigation on mobile devices
- Verify sidebar collapse/expand on mobile

## View Modes (CRITICAL)

**List view and Card view must remain visually distinct:**

- List view: Dotted borders, compact layout, no backgrounds
- Card view: Rounded corners, backgrounds, padding

**When adding styles:**

- Scope card-specific styles to `[data-view="card"]`
- Scope list-specific styles to `[data-view="list"]`
- NEVER add global `.article-item` styles that override view-specific CSS
- ALWAYS test both view modes after changes

## Accessibility

- Use semantic HTML
- Include ARIA labels
- Support dark/light themes
- Persist user preferences
- Keyboard navigation must work
- Screen reader compatible

## Common Pitfalls to Avoid

1. **Adding global styles that break view modes** - Always scope to `[data-view="card"]` or `[data-view="list"]`
2. **JavaScript syntax errors** - Validate with `node -c` before committing
3. **Breaking mobile navigation** - Always test sidebar on mobile viewport
4. **Skipping UI tests** - NEVER commit without running `npm run test:ui`
5. **Not regenerating test data** - Run `bash scripts/test/generate-test-data.sh` after HTML changes
