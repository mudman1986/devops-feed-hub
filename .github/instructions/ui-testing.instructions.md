---
applyTo: "tests/**/*.js,tests/**/*.spec.js"
---

# UI Testing with Playwright

## Test Organization

- Separate layout tests from functionality tests
- Use clear, descriptive test names
- Keep tests focused on single behaviors

## Multi-Device Testing

- Test on Desktop (1920x1080, 1366x768), Tablet (768x1024), Mobile (375x667, 414x896)
- Verify touch targets on mobile
- Check layout consistency

## Best Practices

- Use proper Playwright selectors (role, text, testId)
- Wait for elements to be stable
- Take screenshots on failures
- Keep tests isolated
- Clean up state (localStorage, cookies)

## Running

```bash
npm run test:ui              # All tests
npm run test:ui:headed       # See browser
npm run test:ui:debug        # Debug mode
```
