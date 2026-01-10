---
applyTo: "docs/**/*.js,docs/**/*.html,docs/**/*.css"
---

# Frontend/UI Development

## JavaScript

- Use modern ES6+ syntax
- Use localStorage for client-side persistence
- Handle errors gracefully

## Responsive Design

- **MANDATORY: Test on multiple screen sizes**
  - Desktop: 1920x1080, 1366x768
  - Tablet: 768x1024
  - Mobile: 375x667, 414x896
- Touch targets minimum 44x44px
- Test navigation on mobile devices

## Testing

- Write Jest unit tests: `npm test`
- Write Playwright UI tests in `tests/ui/`
- Test all device configurations

## Accessibility

- Use semantic HTML
- Include ARIA labels
- Support dark/light themes
- Persist user preferences
