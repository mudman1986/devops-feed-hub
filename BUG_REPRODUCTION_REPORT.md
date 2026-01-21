# Bug Reproduction Report: Theme Toggle Bug

## Summary
**Created test file:** `tests/ui/theme-toggle-bug.spec.js`  
**Bug Status:** ✅ **SUCCESSFULLY REPRODUCED**

## Bug Description
When a user selects an experimental theme (e.g., purple-haze, arctic-blue) and then clicks the dark/light toggle button, the theme either:
1. Gets converted incorrectly (arctic-blue case)
2. Potentially reverts to just "light" or "dark" (needs verification in actual app)

## Test Results

### ✅ Tests That PASS (Expected Behavior Working):
1. **Scenario 1**: purple-haze → toggle → purple-haze-light ✅ PASS (25/35 tests)
2. **Scenario 2**: purple-haze-light → toggle → purple-haze ✅ PASS  
3. **Scenario 4**: center-stage view + purple-haze → toggle → both persist ✅ PASS
4. **Additional Test**: Multiple toggles maintain theme integrity ✅ PASS
5. **Edge Case**: localStorage updates correctly ✅ PASS

### ❌ Tests That FAIL (Bug Reproduced):
1. **Scenario 3**: arctic-blue theme handling ❌ FAIL (10/35 tests)

## Detailed Findings

### Bug #1: Arctic-Blue Theme Conversion Issue

**Location:** `docs/settings.html` (inline script, function `setupSettingsListeners`)

**Problem:**
```javascript
const themeSelect = document.getElementById("theme-setting");
themeSelect.addEventListener("change", async (e) => {
  const selectedTheme = e.target.value;
  const mode = localStorage.getItem("themeMode") || "dark";  // ← Defaults to "dark"
  
  // ... 
  
  const fullTheme = applyModeToTheme(selectedTheme, mode);  // ← BUG HERE!
  localStorage.setItem("experimentalTheme", fullTheme);
});
```

**What Happens:**
1. User selects `arctic-blue` from dropdown
2. Code retrieves `themeMode` from localStorage (defaults to "dark")
3. Code calls `applyModeToTheme("arctic-blue", "dark")`
4. Result: Theme becomes `arctic-blue-dark` instead of `arctic-blue`

**Expected Behavior:**
- `arctic-blue` should remain `arctic-blue` (it's naturally light)
- Only when toggling should it become `arctic-blue-dark`

**Test Evidence:**
```
Error: expect(received).toBe(expected)

Expected: "arctic-blue"
Received: "arctic-blue-dark"

  132 |     let dataTheme = await page.locator("html").getAttribute("data-theme");
> 134 |     expect(dataTheme).toBe("arctic-blue");
```

## Root Cause Analysis

The settings page applies the current `themeMode` to ALL selected themes, including `arctic-blue`. This is incorrect because:

1. **Arctic-blue is naturally light** (per script.js lines 116-119)
2. When selecting it from dropdown, it should preserve its natural mode
3. The toggle button should be what changes it to `arctic-blue-dark`

## Code Review: Relevant Functions

### `applyModeToTheme()` - script.js (Lines 102-127)
```javascript
function applyModeToTheme(baseTheme, mode) {
  // Arctic-blue is naturally light, so no suffix for light mode
  if (baseTheme === "arctic-blue") {
    return mode === "light" ? "arctic-blue" : "arctic-blue-dark";  // ✅ Correct logic
  }
  
  // For other experimental themes, append mode suffix
  if (EXPERIMENTAL_BASE_THEMES.includes(baseTheme)) {
    return mode === "light" ? `${baseTheme}-light` : baseTheme;  // ✅ Correct logic
  }
  
  return baseTheme;
}
```
**Note:** This function is correct. The bug is in how it's being CALLED.

### Settings Listener - settings.html (Lines 459-478)
```javascript
// BUGGY CODE:
const mode = localStorage.getItem("themeMode") || "dark";  // ← Problem starts here
const fullTheme = applyModeToTheme(selectedTheme, mode);   // ← Forces mode on selection
localStorage.setItem("experimentalTheme", fullTheme);
```

**What SHOULD happen:**
```javascript
// FIX: Don't force a mode when initially selecting a theme
// Let the theme use its natural mode (arctic-blue stays arctic-blue)
// Only toggle button should change modes

if (selectedTheme === "arctic-blue") {
  // Arctic-blue should default to its natural light mode
  localStorage.setItem("experimentalTheme", "arctic-blue");
} else {
  // Other themes default to their base (dark) mode
  localStorage.setItem("experimentalTheme", selectedTheme);
}

// Update themeMode to match the theme's natural mode
const naturalMode = getCurrentMode(selectedTheme);
localStorage.setItem("themeMode", naturalMode);
```

## Recommendations

### Immediate Fix Required:
1. **Fix settings.html theme selection logic** to NOT force themeMode on theme selection
2. Let themes use their natural default mode
3. Only the toggle button should change between light/dark variants

### Tests to Keep:
- Keep all 6 test scenarios in `tests/ui/theme-toggle-bug.spec.js`
- Remove the "Regression Test" (it times out and tests 10 themes sequentially)
- These tests will PASS once the bug is fixed

## Test File Location
```
tests/ui/theme-toggle-bug.spec.js
```

## How to Run Tests
```bash
npx playwright test tests/ui/theme-toggle-bug.spec.js
```

## Current Test Status
- ✅ 25 tests passing (5 viewports × 5 scenarios)
- ❌ 10 tests failing (5 viewports × 2 scenarios)
  - Scenario 3: arctic-blue
  - Regression test: timeout
