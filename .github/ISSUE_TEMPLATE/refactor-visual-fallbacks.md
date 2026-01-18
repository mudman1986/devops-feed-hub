---
name: 'Refactor: Add visual design fallbacks'
about: Add fallback styles for browsers that don't support advanced CSS features
title: 'Refactor: Add visual design fallbacks'
labels: refactor
assignees: ''
---

## Description

Add fallback styles for browsers that don't support advanced CSS features.

## Issues to Fix

1. **Gradient Text Fallback** (`docs/styles.css`)
   - Add fallback color for browsers that don't support `background-clip: text`
   - Risk: Text becomes invisible if feature not supported

2. **Backdrop Filter Fallback**
   - Add `@supports` fallback for browsers without `backdrop-filter`
   - Affects glassmorphism theme

## Recommended Implementation

```css
/* Gradient text with fallback */
.header-title {
  color: var(--text-primary); /* Fallback */
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Backdrop filter with fallback */
@supports not (backdrop-filter: blur(10px)) {
  .card-bg {
    background-color: var(--bg-secondary);
    opacity: 0.95;
  }
}
```

## Acceptance Criteria

- [ ] Gradient text has color fallback
- [ ] Backdrop filter has fallback styles
- [ ] Tested in browsers without support
- [ ] All themes remain functional
- [ ] No visual regressions
