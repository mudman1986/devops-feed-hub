---
name: 'Refactor: Extract magic numbers to constants'
about: Extract hardcoded magic numbers into named constants for better maintainability
title: 'Refactor: Extract magic numbers to constants'
labels: refactor
assignees: ''
---

## Description

Extract hardcoded magic numbers throughout the codebase into named constants for better maintainability.

## Files to Update

- `docs/script.js`

## Magic Numbers to Extract

1. **Breakpoints**:
   - `768` (mobile breakpoint)
   - `1024` (tablet breakpoint)
   - `1200` (desktop breakpoint)

2. **Timeouts**:
   - `3000` (screen reader delay)
   - `5000` (error message timeout)

3. **Touch Target Sizes**:
   - `48` (minimum touch target)

## Recommended Implementation

```javascript
// At top of script.js
const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
};

const TIMEOUTS = {
  SCREEN_READER_ANNOUNCEMENT: 3000,
  ERROR_MESSAGE_DISMISS: 5000
};

const ACCESSIBILITY = {
  MIN_TOUCH_TARGET_SIZE: 48,
  MIN_FOCUS_OUTLINE_WIDTH: 2
};
```

## Acceptance Criteria

- [ ] All magic numbers replaced with named constants
- [ ] Constants defined at top of file with clear names
- [ ] All tests still passing
- [ ] No functionality changes
