---
name: 'UX: Add user feedback and error states'
about: Improve user experience with loading states, confirmation feedback, and error handling
title: 'UX: Add user feedback and error states'
labels: refactor, enhancement
assignees: ''
---

## Description

Improve user experience by adding loading states, confirmation feedback, and error handling.

## Missing Features

### 1. Loading States
Add visual feedback for:
- Theme changes
- Settings save operations
- Clear all read articles

### 2. Settings Confirmation
Show brief success message when settings are saved (toast notification or inline message).

### 3. "Opens in New Tab" Indicators
Add visual and screen reader indication that article links open in new tabs.

### 4. Error States for Failed Feeds
- Show failed feed count in UI
- Provide "Retry" button
- Display last successful fetch time

## Recommended Implementation

```javascript
// Loading state utility
class LoadingState {
  static show(element, message = "Loading...") {
    element.setAttribute("aria-busy", "true");
    element.classList.add("loading");
  }
  
  static hide(element) {
    element.setAttribute("aria-busy", "false");
    element.classList.remove("loading");
  }
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

### External Link Indicator

```html
<a href="..." class="article-title" target="_blank" rel="noopener noreferrer">
  Article Title
  <span class="sr-only">(opens in new tab)</span>
  <svg class="external-link-icon" aria-hidden="true">...</svg>
</a>
```

## Acceptance Criteria

- [ ] Loading states for async operations
- [ ] Settings save confirmation
- [ ] External link indicators (visual + screen reader)
- [ ] Error handling for failed feeds
- [ ] All accessibility requirements met
- [ ] UI tests updated
