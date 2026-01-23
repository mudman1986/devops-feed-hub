# 🐛 Theme Toggle Bug - Investigation Summary

## ✅ Mission Accomplished

**Created:** `tests/ui/theme-toggle-bug.spec.js` - A comprehensive test suite that successfully reproduces the theme toggle bug.

**Test Results:**

- ✅ **25 tests PASSING** (5 viewports × 5 scenarios) - Normal theme toggle behavior works
- ❌ **5 tests FAILING** (5 viewports × 1 scenario) - Arctic-blue bug reproduced

---

## 🎯 Bug Reproduction Status: SUCCESS

The test file **successfully reproduces the bug** where the `arctic-blue` theme is incorrectly converted when selected from the settings dropdown.

### Test Scenarios Created

| Scenario       | Description                                     | Status  | Tests |
| -------------- | ----------------------------------------------- | ------- | ----- |
| **Scenario 1** | purple-haze → toggle → purple-haze-light        | ✅ PASS | 5/5   |
| **Scenario 2** | purple-haze-light → toggle back → purple-haze   | ✅ PASS | 5/5   |
| **Scenario 3** | arctic-blue selection & toggle (REPRODUCES BUG) | ❌ FAIL | 0/5   |
| **Scenario 4** | View mode + theme both persist on toggle        | ✅ PASS | 5/5   |
| **Scenario 5** | Multiple toggles maintain theme integrity       | ✅ PASS | 5/5   |
| **Scenario 6** | localStorage updates correctly                  | ✅ PASS | 5/5   |

---

## 🔍 Bug Details

### The Problem

When a user selects the `arctic-blue` theme from the settings dropdown:

**Expected:** Theme becomes `arctic-blue` (its natural light mode)  
**Actual:** Theme becomes `arctic-blue-dark` ❌

This happens because `settings.html` forcefully applies the current `themeMode` (which defaults to "dark") to ALL selected themes, even those with special natural modes.

### Root Cause

**File:** `docs/settings.html` (inline script, lines ~459-478)

```javascript
// BUGGY CODE:
themeSelect.addEventListener("change", async (e) => {
  const selectedTheme = e.target.value;
  const mode = localStorage.getItem("themeMode") || "dark"; // ⚠️ Defaults to "dark"

  // ...

  const fullTheme = applyModeToTheme(selectedTheme, mode); // ⚠️ Forces dark mode on arctic-blue
  localStorage.setItem("experimentalTheme", fullTheme); // Saves as "arctic-blue-dark"
});
```

### What Should Happen

Arctic-blue should preserve its natural mode when selected:

- Natural mode: `arctic-blue` (light)
- Dark variant: `arctic-blue-dark` (only via toggle button)

### Test Evidence

```bash
Error: expect(received).toBe(expected) // Object.is equality

Expected: "arctic-blue"
Received: "arctic-blue-dark"

  > 140 |     expect(dataTheme).toBe("arctic-blue"); // This will FAIL with current code
```

---

## 📋 Test File Details

### Location

```text
tests/ui/theme-toggle-bug.spec.js
```

### How to Run

```bash
# Run just this test file
npx playwright test tests/ui/theme-toggle-bug.spec.js

# Run with verbose output
npx playwright test tests/ui/theme-toggle-bug.spec.js --reporter=list

# Run specific scenario
npx playwright test tests/ui/theme-toggle-bug.spec.js -g "arctic-blue"
```

### Test Coverage

The test file covers:

1. ✅ Basic theme toggle (dark ↔ light)
2. ✅ Theme persistence across page navigation
3. ✅ localStorage synchronization
4. ✅ View mode + theme combination persistence
5. ✅ Multiple sequential toggles
6. ❌ Arctic-blue special case (REPRODUCES BUG)

---

## 🔧 Recommended Fix

### Problem Area

`docs/settings.html` - Theme selection event listener

### Suggested Solution

```javascript
themeSelect.addEventListener("change", async (e) => {
  const selectedTheme = e.target.value;

  if (selectedTheme === "default") {
    // Clear experimental theme and use default
    localStorage.removeItem("experimentalTheme");
    const mode = localStorage.getItem("themeMode") || "dark";
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  } else {
    // For experimental themes, use their NATURAL mode (not forced mode)
    // Arctic-blue should be "arctic-blue", not "arctic-blue-dark"
    // Purple-haze should be "purple-haze", not "purple-haze-light"

    localStorage.setItem("experimentalTheme", selectedTheme); // Save base theme
    localStorage.removeItem("theme");

    // Update themeMode to match the theme's natural mode
    const naturalMode = isLightMode(selectedTheme) ? "light" : "dark";
    localStorage.setItem("themeMode", naturalMode);

    applyTheme(selectedTheme);
    showToast(`Theme changed to ${selectedTheme}`, "success");
  }
});
```

### Key Changes

1. **Don't force themeMode** on theme selection
2. **Save base theme** (e.g., "arctic-blue", "purple-haze")
3. **Detect natural mode** from the theme itself
4. **Let toggle button** handle light/dark variants

---

## 📊 Impact Analysis

### Affected Themes

- **arctic-blue** (naturally light) - Currently broken ❌
- All other experimental themes - Working correctly ✅

### Affected User Flows

1. ❌ Select arctic-blue → Gets dark version instead of light
2. ✅ Select purple-haze → Toggle → Works correctly
3. ✅ Select ocean-deep → Toggle → Works correctly
4. ✅ All other themes → Works correctly

---

## 🧪 Test Strategy

### Why These Tests Work

1. **Scenario 3 FAILS** → Proves the bug exists
2. **Scenarios 1, 2, 4, 5, 6 PASS** → Proves other functionality works
3. **All 5 viewports tested** → Ensures responsive consistency

### When Bug is Fixed

Once the settings.html code is corrected:

- All 30 tests should PASS (6 scenarios × 5 viewports)
- The test file becomes a regression test
- Prevents this bug from reoccurring

---

## 📝 Next Steps

1. ✅ **Done:** Test file created and bug reproduced
2. 🔄 **Next:** Fix settings.html theme selection logic
3. 🔄 **Next:** Run tests again to verify fix
4. 🔄 **Next:** Add these tests to CI/CD pipeline

---

## 📎 Related Files

- `tests/ui/theme-toggle-bug.spec.js` - New test file
- `docs/settings.html` - Contains the bug (theme selection listener)
- `docs/script.js` - Theme utility functions (correct logic)
- `BUG_REPRODUCTION_REPORT.md` - Detailed technical analysis

---

## 🎓 Key Learnings

1. **Test-first approach** - Tests revealed the exact bug location
2. **Arctic-blue special case** - Naturally light theme needs special handling
3. **Mode forcing issue** - Don't force themeMode on theme selection
4. **Natural defaults** - Themes should use their natural mode first
