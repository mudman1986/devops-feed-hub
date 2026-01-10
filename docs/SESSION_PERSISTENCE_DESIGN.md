# Session Persistence Design Document

**Feature**: Cross-Device Session Persistence for DevOps Feed Hub

**Date**: January 2026

**Status**: Design/Planning Phase

## Overview

This document outlines various approaches for implementing cross-device session persistence in DevOps Feed Hub. Currently, user preferences (theme, view mode, timeframe filter, and read articles) are stored in browser `localStorage`, which is device-specific. This design explores solutions to sync these settings across multiple devices.

## Current State

### Settings Stored Locally

The following user preferences are currently stored in `localStorage`:

1. **Theme**: `'dark'` or `'light'` (default: `'dark'`)
2. **View Mode**: `'list'` or `'card'` (default: `'list'`)
3. **Timeframe Filter**: `'1day'`, `'7days'`, or `'30days'` (default: `'1day'`)
4. **Read Articles**: Array of article URLs marked as read (default: `[]`)

### Current Architecture

- **Frontend**: Static HTML/CSS/JavaScript hosted on GitHub Pages
- **Backend**: None (static site)
- **Data Collection**: GitHub Actions workflow collects RSS feeds and generates static HTML
- **Storage**: Browser `localStorage` only

## Design Goals

1. **Sync user settings across devices**
2. **Maintain privacy and security**
3. **Minimize complexity and maintenance burden**
4. **Keep costs low or zero**
5. **Preserve the simplicity of the current static site architecture**
6. **Support anonymous/unauthenticated users when possible**

## Solution Options (Ranked by Complexity)

### Solution 1: URL-Based State Sharing (Lowest Complexity)

**Complexity Rating**: ⭐ (Very Low)

**Description**: Encode user preferences in URL parameters or hash fragments that users can bookmark or share across devices.

**Implementation**:

```javascript
// Example URL: https://mudman1986.github.io/devops-feed-hub/#theme=dark&view=list&timeframe=7days

// On settings change, update URL hash
function updateURLState() {
  const state = {
    theme: localStorage.getItem("theme"),
    view: localStorage.getItem("view"),
    timeframe: localStorage.getItem("timeframe"),
  };
  window.location.hash = new URLSearchParams(state).toString();
}

// On page load, read from URL
function loadURLState() {
  const params = new URLSearchParams(window.location.hash.substring(1));
  if (params.has("theme")) localStorage.setItem("theme", params.get("theme"));
  // ... etc
}
```

**Pros**:

- ✅ Zero infrastructure required
- ✅ No backend needed
- ✅ No authentication required
- ✅ Works immediately with existing codebase
- ✅ User controls their data completely
- ✅ Shareable settings via URL

**Cons**:

- ❌ Read articles list would make URLs very long
- ❌ Manual process (bookmark/share URL)
- ❌ No automatic sync
- ❌ URL can look messy with many parameters

**Use Cases**:

- Users who want to share their preferred settings
- Quick manual sync by bookmarking specific configurations
- Power users who can manage their own URLs

**Estimated Implementation Time**: 2-4 hours

---

### Solution 2: Import/Export Settings File (Low Complexity)

**Complexity Rating**: ⭐⭐ (Low)

**Description**: Allow users to export their settings to a JSON file and import them on other devices.

**Implementation**:

```javascript
// Export settings
function exportSettings() {
  const settings = {
    theme: localStorage.getItem("theme"),
    view: localStorage.getItem("view"),
    timeframe: localStorage.getItem("timeframe"),
    readArticles: JSON.parse(localStorage.getItem("readArticles") || "[]"),
    exportDate: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devops-feed-hub-settings-${Date.now()}.json`;
  a.click();
}

// Import settings
function importSettings(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const settings = JSON.parse(e.target.result);
    localStorage.setItem("theme", settings.theme);
    localStorage.setItem("view", settings.view);
    localStorage.setItem("timeframe", settings.timeframe);
    localStorage.setItem("readArticles", JSON.stringify(settings.readArticles));
    location.reload();
  };
  reader.readAsText(file);
}
```

**UI Additions**:

- "Export Settings" button in header/sidebar
- "Import Settings" file picker button
- Simple file upload dialog

**Pros**:

- ✅ Zero infrastructure required
- ✅ No backend needed
- ✅ No authentication required
- ✅ Complete user control over data
- ✅ Works offline
- ✅ Can include read articles without URL length limits
- ✅ Settings are portable and can be backed up

**Cons**:

- ❌ Manual process required
- ❌ No automatic sync
- ❌ Users need to remember to export/import
- ❌ Risk of losing data if file is lost

**Use Cases**:

- Users who switch between work and personal devices
- Backup and restore scenarios
- Migration between browsers

**Estimated Implementation Time**: 4-6 hours

---

### Solution 3: Browser Sync APIs (Low-Medium Complexity)

**Complexity Rating**: ⭐⭐⭐ (Low-Medium)

**Description**: Leverage browser-native sync capabilities like Chrome Sync Storage API (for Chrome extensions) or encourage users to use browser sync features.

**Implementation**:

Option A: Create a browser extension that uses `chrome.storage.sync`

```javascript
// Chrome Extension (background.js)
chrome.storage.sync.set({
  "devops-feed-hub-theme": "dark",
  "devops-feed-hub-view": "list",
  "devops-feed-hub-timeframe": "1day",
  "devops-feed-hub-readArticles": [],
});

// Sync across devices automatically via Chrome Sync
```

Option B: Document how users can sync localStorage via browser features

**Pros**:

- ✅ Leverages existing browser infrastructure
- ✅ Automatic sync (if extension route)
- ✅ No custom backend needed
- ✅ Secure (browser handles encryption)

**Cons**:

- ❌ Requires browser extension (separate artifact to maintain)
- ❌ Browser-specific (Chrome, Firefox have different APIs)
- ❌ Users must install extension
- ❌ localStorage doesn't auto-sync in most browsers
- ❌ Limited to ~100KB storage in Chrome Sync Storage

**Use Cases**:

- Chrome/Firefox users who want automatic sync
- Organizations that can deploy extensions

**Estimated Implementation Time**: 16-24 hours (extension development + documentation)

---

### Solution 4: Cloud Storage with GitHub Authentication (Medium Complexity)

**Complexity Rating**: ⭐⭐⭐⭐ (Medium)

**Description**: Use GitHub as an OAuth provider and store user settings in a serverless backend (e.g., GitHub Gist, Cloudflare Workers KV, or Vercel Edge Config).

**Implementation**:

**Option A: GitHub Gist Storage**

```javascript
// Authenticate with GitHub OAuth
async function loginWithGitHub() {
  // Redirect to GitHub OAuth
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=gist`;
}

// After OAuth callback, store settings in private Gist
async function saveSettings(token, settings) {
  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "DevOps Feed Hub Settings",
      public: false,
      files: {
        "settings.json": {
          content: JSON.stringify(settings),
        },
      },
    }),
  });
  const gist = await response.json();
  localStorage.setItem("settingsGistId", gist.id);
}

// Load settings from Gist
async function loadSettings(token, gistId) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `token ${token}` },
  });
  const gist = await response.json();
  return JSON.parse(gist.files["settings.json"].content);
}
```

**Option B: Serverless Function + Database**

Use Cloudflare Workers or Vercel Edge Functions with KV storage:

```javascript
// Cloudflare Worker (worker.js)
export default {
  async fetch(request, env) {
    const { userId, settings } = await request.json();

    // Store in Cloudflare KV
    await env.USER_SETTINGS.put(userId, JSON.stringify(settings));

    return new Response("Settings saved", { status: 200 });
  },
};
```

**Architecture**:

1. User clicks "Sign in with GitHub"
2. OAuth flow redirects to GitHub
3. GitHub redirects back with access token
4. Frontend stores token securely (sessionStorage)
5. Settings are synced to Gist or serverless backend
6. On other devices, user signs in and settings auto-load

**Pros**:

- ✅ Automatic sync across devices
- ✅ Leverages existing GitHub ecosystem
- ✅ Secure authentication
- ✅ No separate user account system needed
- ✅ Can use free tier of serverless platforms
- ✅ Settings persist even if browser data is cleared

**Cons**:

- ❌ Requires OAuth app registration
- ❌ Needs serverless function deployment (unless using Gist)
- ❌ GitHub API rate limits (5000 requests/hour authenticated)
- ❌ Requires user to have GitHub account
- ❌ More complex frontend code
- ❌ Token management and security considerations
- ❌ CORS configuration needed

**Security Considerations**:

- Store OAuth tokens in `sessionStorage` (not localStorage)
- Use state parameter to prevent CSRF
- Implement token refresh logic
- Never commit CLIENT_SECRET to repository

**Cost**:

- **GitHub Gist**: Free
- **Cloudflare Workers**: Free tier (100,000 requests/day)
- **Vercel Edge Functions**: Free tier (100,000 requests/month)

**Use Cases**:

- Users with GitHub accounts
- Developers who are already logged into GitHub
- Users who want automatic, seamless sync

**Estimated Implementation Time**: 40-60 hours

---

### Solution 5: Dedicated Backend Service (High Complexity)

**Complexity Rating**: ⭐⭐⭐⭐⭐ (High)

**Description**: Build a full backend API with database, authentication, and user management.

**Implementation**:

**Stack Options**:

1. **Express.js + PostgreSQL + Render/Railway**
2. **FastAPI (Python) + SQLite/PostgreSQL + Fly.io**
3. **Supabase** (Backend-as-a-Service with PostgreSQL and Auth)

**Architecture**:

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTPS/REST API
       ▼
┌─────────────────┐
│   API Server    │
│  (Express/Fast) │
│   - Auth        │
│   - Settings    │
│   - CRUD        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│  (PostgreSQL)   │
│  - users        │
│  - settings     │
└─────────────────┘
```

**Database Schema**:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'dark',
  view_mode VARCHAR(10) DEFAULT 'list',
  timeframe VARCHAR(10) DEFAULT '1day',
  read_articles JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints**:

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/sync` - Sync settings

**Pros**:

- ✅ Full control over features
- ✅ Can add advanced features (analytics, recommendations)
- ✅ Automatic sync
- ✅ Can support any authentication method
- ✅ Scalable architecture
- ✅ Can add social features (shared reading lists)

**Cons**:

- ❌ Significant development effort
- ❌ Ongoing maintenance required
- ❌ Security responsibilities (password storage, etc.)
- ❌ Hosting costs
- ❌ Need to implement user registration/login
- ❌ GDPR compliance considerations
- ❌ Database backup and disaster recovery
- ❌ Monitoring and alerting needed

**Cost** (Monthly):

- **Render**: $7/month (PostgreSQL) + $7/month (Web service) = ~$14/month
- **Railway**: ~$5-10/month
- **Fly.io**: ~$5-10/month
- **Supabase**: Free tier up to 500MB database, 50,000 monthly active users

**Use Cases**:

- Large user base with advanced needs
- Commercial product
- When social features are desired

**Estimated Implementation Time**: 100-150 hours

---

## Recommended Approach

### Phased Implementation Strategy

For DevOps Feed Hub, I recommend a **phased approach** starting with the simplest solutions:

#### Phase 1: Quick Wins (Solutions 1 & 2)

**Implement both URL-based and Import/Export features**:

1. **URL-based state** for basic preferences (theme, view, timeframe)
2. **Import/Export** for complete backup including read articles
3. Timeline: 1 week
4. Cost: $0
5. Maintenance: Minimal

**Rationale**: These solutions provide immediate value with zero infrastructure, and they can coexist with or complement any future solution.

#### Phase 2: If Demand Grows (Solution 4)

**Implement GitHub OAuth with Gist storage**:

1. Only if users request automatic sync
2. Leverage existing GitHub ecosystem
3. Timeline: 1-2 weeks
4. Cost: $0
5. Maintenance: Low

**Rationale**: Since the project is hosted on GitHub and likely used by developers, GitHub OAuth is a natural fit. Gist storage is free and requires no additional infrastructure.

#### Phase 3: If Product Scales (Solution 5)

**Build dedicated backend**:

1. Only if user base grows significantly
2. When advanced features are needed
3. Consider Supabase for rapid development
4. Timeline: 1-2 months
5. Cost: ~$10-15/month initially
6. Maintenance: Medium-High

**Rationale**: Only invest in a full backend if there's proven demand and the simpler solutions are insufficient.

---

## Security and Privacy Considerations

### General

- **Encryption**: All data transmission must use HTTPS
- **Input Validation**: Sanitize all user input
- **XSS Protection**: Validate JSON imports to prevent code injection
- **CORS**: Configure properly for any backend APIs

### For OAuth Solutions (Solution 4)

- Use `state` parameter to prevent CSRF attacks
- Store tokens in `sessionStorage`, not `localStorage`
- Implement token expiration and refresh
- Never expose CLIENT_SECRET in frontend code
- Use environment variables for secrets

### For Backend Solutions (Solution 5)

- Use bcrypt/argon2 for password hashing (min 12 rounds)
- Implement rate limiting on API endpoints
- Add CSRF protection
- Implement proper session management
- Regular security audits
- GDPR compliance (data export, deletion)

### Data Minimization

- Only sync necessary data
- Don't collect analytics without user consent
- Provide clear privacy policy
- Allow users to delete their data

---

## Migration Plan

If implementing any sync solution, consider migration for existing users:

1. **Detect existing localStorage data** on first login
2. **Prompt user** to import their current settings
3. **One-time migration** from localStorage to backend
4. **Keep localStorage as fallback** if backend is unavailable

---

## Testing Strategy

### For All Solutions

- Test with localStorage disabled (privacy mode)
- Test with quota exceeded scenarios
- Test across different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Test data import/export edge cases (corrupted JSON, old formats)

### For OAuth/Backend Solutions

- Test OAuth flow in different browsers
- Test token expiration and refresh
- Test concurrent updates from multiple devices
- Load testing for API endpoints
- Test offline behavior and sync conflicts

---

## Metrics and Success Criteria

### User Adoption

- % of users who enable sync
- % of users who use import/export
- Number of devices per user

### Reliability

- Sync success rate
- API uptime (if applicable)
- Error rates

### Performance

- Time to sync settings
- API response times

---

## Alternatives Considered But Not Recommended

### IndexedDB/WebSQL

- **Why Not**: Still device-local, doesn't solve cross-device sync
- **Could Use**: As a caching layer for a backend solution

### P2P Sync (WebRTC)

- **Why Not**: Too complex, requires devices to be online simultaneously
- **Complexity**: Very High

### Email-Based Sync

- **Why Not**: Poor UX, security concerns with email
- **Complexity**: Medium

### QR Code Transfer

- **Why Not**: Manual, only works for one-time transfer
- **Complexity**: Low-Medium

---

## Conclusion

For DevOps Feed Hub, the recommended path is:

1. **Start with URL-based state and Import/Export** (Solutions 1 & 2) for immediate value with zero cost
2. **Add GitHub OAuth + Gist** (Solution 4) if automatic sync is requested by users
3. **Only build a backend** (Solution 5) if the project grows into a product with significant user base

This phased approach minimizes risk and investment while providing progressive enhancement based on actual user demand.

---

## Appendix: Code Examples

### Example: URL State Manager

```javascript
class URLStateManager {
  static EXCLUDED_KEYS = ["readArticles"]; // Too long for URL

  static saveToURL() {
    const state = {};
    const keys = ["theme", "view", "timeframe"];

    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) state[key] = value;
    });

    const params = new URLSearchParams(state);
    window.history.replaceState(null, "", `#${params.toString()}`);
  }

  static loadFromURL() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    let loaded = false;

    params.forEach((value, key) => {
      if (!this.EXCLUDED_KEYS.includes(key)) {
        localStorage.setItem(key, value);
        loaded = true;
      }
    });

    return loaded;
  }
}

// Usage
if (URLStateManager.loadFromURL()) {
  console.log("Settings loaded from URL");
  location.reload();
}

// Update URL when settings change
document.getElementById("theme-toggle").addEventListener("click", () => {
  // ... existing theme toggle code ...
  URLStateManager.saveToURL();
});
```

### Example: Import/Export Manager

```javascript
class SettingsManager {
  static export() {
    const settings = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      theme: localStorage.getItem("theme") || "dark",
      view: localStorage.getItem("view") || "list",
      timeframe: localStorage.getItem("timeframe") || "1day",
      readArticles: JSON.parse(localStorage.getItem("readArticles") || "[]"),
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devops-feed-hub-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);

          // Validate settings format
          if (!settings.version) {
            throw new Error("Invalid settings file: missing version");
          }

          // Apply settings
          localStorage.setItem("theme", settings.theme);
          localStorage.setItem("view", settings.view);
          localStorage.setItem("timeframe", settings.timeframe);
          localStorage.setItem(
            "readArticles",
            JSON.stringify(settings.readArticles),
          );

          resolve(settings);
        } catch (error) {
          reject(new Error(`Failed to import settings: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }
}

// Usage: Add buttons to UI
const exportBtn = document.getElementById("export-settings");
const importInput = document.getElementById("import-settings");

exportBtn.addEventListener("click", () => {
  SettingsManager.export();
  alert("Settings exported successfully!");
});

importInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    await SettingsManager.import(file);
    alert("Settings imported successfully! The page will reload.");
    location.reload();
  } catch (error) {
    alert(error.message);
  }
});
```

---

## References

- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub Gists API](https://docs.github.com/en/rest/gists)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
