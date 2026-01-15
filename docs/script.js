/* eslint-env browser */

// Mark as Read constants
const READ_ARTICLES_KEY = "readArticles";

// List of valid experimental themes
const VALID_EXPERIMENTAL_THEMES = [
  "purple-haze",
  "purple-haze-light",
  "ocean-deep",
  "ocean-deep-light",
  "arctic-blue",
  "high-contrast-dark",
  "high-contrast-light",
  "monochrome",
  "dracula",
  "dracula-light",
  "minimalist",
  "terminal",
  "retro",
  "futuristic",
  "compact",
  "horizontal-scroll",
  "masonry-grid",
  "floating-panels",
  "center-stage",
  "top-strip",
  "list-dense",
  "timeline-vertical",
];

// ===== SHARED UTILITY FUNCTIONS =====

/**
 * Safely get item from localStorage with error handling
 * @param {string} key - localStorage key
 * @param {*} defaultValue - default value if key not found or error occurs
 * @returns {*} - stored value or default
 */
function getLocalStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  } catch (e) {
    console.warn(`localStorage unavailable for key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Safely get JSON from localStorage with error handling
 * @param {string} key - localStorage key
 * @param {*} defaultValue - default value if key not found or error occurs
 * @returns {*} - parsed JSON value or default
 */
function getLocalStorageJSON(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.warn(`localStorage unavailable or invalid JSON for key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage with error handling
 * @param {string} key - localStorage key
 * @param {string} value - value to store
 */
function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Unable to save to localStorage for key "${key}":`, e);
  }
}

/**
 * Safely set JSON in localStorage with error handling
 * @param {string} key - localStorage key
 * @param {*} value - value to JSON stringify and store
 */
function setLocalStorageJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Unable to save to localStorage for key "${key}":`, e);
  }
}

/**
 * Initialize a dropdown with saved value from localStorage
 * @param {string} selectId - ID of select element
 * @param {string} storageKey - localStorage key
 * @param {string} defaultValue - default value if not in storage
 * @param {function} onChange - callback when value changes
 * @returns {HTMLElement|null} - select element or null
 */
function initializeDropdown(selectId, storageKey, defaultValue, onChange) {
  const select = document.getElementById(selectId);
  if (!select) return null;

  const savedValue = getLocalStorage(storageKey, defaultValue);
  select.value = savedValue;
  
  select.addEventListener("change", () => {
    const value = select.value;
    setLocalStorage(storageKey, value);
    onChange(value);
  });
  
  return select;
}

/**
 * Sort and reorder DOM elements based on data array
 * @param {Array} dataArray - array of objects with 'element' property
 * @param {HTMLElement} parent - parent container element
 * @param {HTMLElement|null} beforeElement - insert before this element (e.g., footer)
 */
function reorderDOMElements(dataArray, parent, beforeElement = null) {
  dataArray.forEach((data) => {
    if (beforeElement) {
      parent.insertBefore(data.element, beforeElement);
    } else {
      parent.appendChild(data.element);
    }
  });
}

// ===== THEME TOGGLE FUNCTIONALITY =====

const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;

// Check for experimental theme first, then fall back to standard theme
let savedTheme = "dark";
const experimentalTheme = getLocalStorage("experimentalTheme");
if (experimentalTheme && VALID_EXPERIMENTAL_THEMES.includes(experimentalTheme)) {
  savedTheme = experimentalTheme;
} else {
  if (experimentalTheme) {
    console.warn(`Invalid experimental theme: ${experimentalTheme}. Using default.`);
    try {
      localStorage.removeItem("experimentalTheme");
    } catch (e) {
      console.warn("Unable to remove invalid theme:", e);
    }
  }
  savedTheme = getLocalStorage("theme", "dark");
}

htmlElement.setAttribute("data-theme", savedTheme);
updateThemeButton(savedTheme);

themeToggle.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  htmlElement.setAttribute("data-theme", newTheme);
  setLocalStorage("theme", newTheme);
  
  // Clear experimental theme when toggling standard theme
  try {
    localStorage.removeItem("experimentalTheme");
  } catch (e) {
    console.warn("Unable to remove experimental theme:", e);
  }

  updateThemeButton(newTheme);
});

function updateThemeButton(theme) {
  const iconSVG = document.getElementById("theme-icon");
  const themeText = document.getElementById("theme-text");

  if (theme === "dark") {
    // Sun icon for light mode
    iconSVG.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    if (themeText) {
      themeText.textContent = "Light Mode";
    }
  } else {
    // Moon icon for dark mode
    iconSVG.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    if (themeText) {
      themeText.textContent = "Dark Mode";
    }
  }
}

// ===== VIEW SELECTOR FUNCTIONALITY =====

const savedView = getLocalStorage("view", "list");
initializeDropdown("view-select", "view", "list", applyView);
applyView(savedView);

function applyView(view) {
  // List is now the default, card needs the attribute
  if (view === "card") {
    htmlElement.setAttribute("data-view", "card");
  } else {
    // For list view, set data-view="list" to apply list styles
    htmlElement.setAttribute("data-view", "list");
  }
}

// ===== SIDEBAR FUNCTIONALITY =====

function initializeSidebarState(sidebar) {
  // On mobile, start collapsed; on desktop, start expanded
  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
}

const sidebarToggle = document.getElementById("nav-toggle");
const sidebar = document.getElementById("sidebar");

if (sidebarToggle && sidebar) {
  initializeSidebarState(sidebar);
  window.addEventListener("resize", () => initializeSidebarState(sidebar));

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Close sidebar when clicking outside (mobile only)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add("collapsed");
      }
    }
  });
}

// ===== TIMEFRAME FILTERING =====

const TIMEFRAME_HOURS = {
  "1day": 24,
  "7days": 168,
  "30days": 720,
};

const savedTimeframe = getLocalStorage("timeframe", "1day");
initializeDropdown("timeframe-select", "timeframe", "1day", applyTimeframeFilter);
applyTimeframeFilter(savedTimeframe);

function applyTimeframeFilter(timeframe) {
  const hours = TIMEFRAME_HOURS[timeframe] || 24;
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Filter articles by timeframe
  const allArticles = document.querySelectorAll(".article-item");

  allArticles.forEach((article) => {
    const publishedISO = article.getAttribute("data-published");
    if (publishedISO) {
      try {
        const publishDate = new Date(publishedISO);
        if (!Number.isNaN(publishDate.getTime())) {
          if (publishDate >= cutoffTime) {
            article.removeAttribute("data-hidden-by-timeframe");
            article.style.display = "";
          } else {
            article.setAttribute("data-hidden-by-timeframe", "true");
            article.style.display = "none";
          }
        } else {
          article.removeAttribute("data-hidden-by-timeframe");
          article.style.display = "";
        }
      } catch {
        article.removeAttribute("data-hidden-by-timeframe");
        article.style.display = "";
      }
    } else {
      article.removeAttribute("data-hidden-by-timeframe");
      article.style.display = "";
    }
  });

  // Update feed counts and reorder
  updateFeedCounts();
  updateMetadataDisplay();
  updateStats();
}

/**
 * Update feed counts and reorder feeds
 */
function updateFeedCounts() {
  const feedSections = document.querySelectorAll(".feed-section");
  const feedsData = [];

  feedSections.forEach((section) => {
    const articles = section.querySelectorAll(".article-item");
    const visibleArticles = Array.from(articles).filter(
      (a) => a.style.display !== "none",
    );
    const count = visibleArticles.length;

    // Update count badge
    const countBadge = section.querySelector(".feed-count");
    if (countBadge) {
      const plural = count !== 1 ? "s" : "";
      countBadge.textContent = `${count} article${plural}`;
    }

    // Show "no articles" message if no visible articles
    const noArticlesMsg = section.querySelector(".no-articles");
    const articleList = section.querySelector(".article-list");

    if (count === 0) {
      if (articleList) articleList.style.display = "none";
      if (!noArticlesMsg) {
        const msg = document.createElement("div");
        msg.className = "no-articles";
        msg.textContent = "No new articles in this time period";
        section.appendChild(msg);
      } else {
        noArticlesMsg.style.display = "";
      }
    } else {
      if (articleList) articleList.style.display = "";
      if (noArticlesMsg) {
        noArticlesMsg.remove();
      }
    }

    feedsData.push({
      element: section,
      count,
      name: section.querySelector("h3")?.textContent.trim() || "",
    });
  });

  // Reorder feeds
  if (feedSections.length > 0 && feedSections[0].parentNode) {
    const parent = feedSections[0].parentNode;
    const footer = parent.querySelector(".footer");

    const feedsWithArticles = feedsData
      .filter((f) => f.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    const emptyFeeds = feedsData
      .filter((f) => f.count === 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    const orderedFeeds = [...feedsWithArticles, ...emptyFeeds];
    reorderDOMElements(orderedFeeds, parent, footer);
  }
}

function updateMetadataDisplay() {
  // Kept for compatibility with generated HTML pages
}

function updateStats() {
  const statCards = document.querySelectorAll(".stat-card");
  if (statCards.length === 0) return;

  const allArticles = document.querySelectorAll(".article-item");
  if (allArticles.length === 0) return;

  const visibleArticles = Array.from(allArticles).filter(
    (a) => a.style.display !== "none",
  );

  statCards.forEach((card) => {
    const label = card.querySelector(".stat-label");
    if (label && label.textContent === "Total Articles") {
      const value = card.querySelector(".stat-value");
      if (value) {
        value.textContent = visibleArticles.length;
      }
    }
  });
}

// ===== MARK AS READ FUNCTIONALITY =====

function getReadArticles() {
  return getLocalStorageJSON(READ_ARTICLES_KEY, []);
}

function saveReadArticles(readArticles) {
  setLocalStorageJSON(READ_ARTICLES_KEY, readArticles);
}

function isArticleRead(articleUrl) {
  const readArticles = getReadArticles();
  return readArticles.includes(articleUrl);
}

function toggleArticleRead(articleUrl) {
  let readArticles = getReadArticles();

  if (readArticles.includes(articleUrl)) {
    readArticles = readArticles.filter((url) => url !== articleUrl);
  } else {
    readArticles.push(articleUrl);
  }

  saveReadArticles(readArticles);
  return readArticles.includes(articleUrl);
}

function resetAllReadArticles() {
  try {
    localStorage.removeItem(READ_ARTICLES_KEY);
    initializeReadStatus();
    updateFeedCountsAfterReadFilter();
  } catch (e) {
    console.warn("Unable to reset read articles:", e);
  }
}

function initializeReadStatus() {
  const articles = document.querySelectorAll(".article-item");

  articles.forEach((article) => {
    const link = article.querySelector(".article-title");
    if (!link) return;

    const articleUrl = link.getAttribute("href");
    if (!articleUrl) return;

    const existingIndicator = article.querySelector(".read-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }

    const indicator = document.createElement("button");
    indicator.className = "read-indicator";
    indicator.setAttribute("aria-label", "Mark as read/unread");
    indicator.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    indicator.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleArticleRead(articleUrl);
      updateArticleReadState(article, articleUrl);
      updateFeedCountsAfterReadFilter();
    });

    article.insertBefore(indicator, article.firstChild);
    updateArticleReadState(article, articleUrl);
  });
}

function updateArticleReadState(article, articleUrl) {
  const indicator = article.querySelector(".read-indicator");
  const isRead = isArticleRead(articleUrl);

  if (isRead) {
    article.classList.add("read");
    if (indicator) indicator.classList.add("active");
  } else {
    article.classList.remove("read");
    if (indicator) indicator.classList.remove("active");
  }
}

function updateFeedCountsAfterReadFilter() {
  const feedSections = document.querySelectorAll(".feed-section");
  const feedsData = [];

  feedSections.forEach((section) => {
    const articleList = section.querySelector(".article-list");
    if (!articleList) return;

    const articles = section.querySelectorAll(".article-item");
    const visibleArticles = Array.from(articles).filter(
      (a) => a.style.display !== "none",
    );

    const unreadArticles = Array.from(articles).filter((article) => {
      const link = article.querySelector(".article-title");
      if (!link) return false;
      const articleUrl = link.getAttribute("href");
      return (
        !isArticleRead(articleUrl) &&
        !article.hasAttribute("data-hidden-by-timeframe")
      );
    });

    const count = visibleArticles.length;
    const unreadCount = unreadArticles.length;

    reorderArticlesInFeed(articleList, articles);

    const countBadge = section.querySelector(".feed-count");
    if (countBadge) {
      const plural = count !== 1 ? "s" : "";
      countBadge.textContent = `${count} article${plural}`;
    }

    const noArticlesMsg = section.querySelector(".no-articles");

    if (count === 0) {
      if (articleList) articleList.style.display = "none";
      if (!noArticlesMsg) {
        const msg = document.createElement("div");
        msg.className = "no-articles";
        msg.textContent = "No articles to display";
        section.appendChild(msg);
      } else {
        noArticlesMsg.style.display = "";
      }
    } else {
      if (articleList) articleList.style.display = "";
      if (noArticlesMsg) noArticlesMsg.style.display = "none";
    }

    feedsData.push({
      element: section,
      count,
      unreadCount,
      name: section.querySelector("h3")?.textContent.trim() || "",
    });
  });

  reorderFeedsByUnreadStatus(feedsData);
  updateStats();
}

function reorderArticlesInFeed(articleList, articles) {
  if (!articleList || articles.length === 0) return;

  const articleData = Array.from(articles).map((article) => {
    const link = article.querySelector(".article-title");
    const articleUrl = link ? link.getAttribute("href") : null;
    const isRead = articleUrl ? isArticleRead(articleUrl) : false;
    const publishedISO = article.getAttribute("data-published");
    const publishDate = publishedISO ? new Date(publishedISO) : new Date(0);

    return {
      element: article,
      isRead,
      articleUrl,
      publishDate,
    };
  });

  const unreadArticles = articleData
    .filter((a) => !a.isRead)
    .sort((a, b) => b.publishDate - a.publishDate);
  const readArticles = articleData
    .filter((a) => a.isRead)
    .sort((a, b) => b.publishDate - a.publishDate);

  const orderedArticles = [...unreadArticles, ...readArticles];
  orderedArticles.forEach((articleData) => {
    articleList.appendChild(articleData.element);
  });
}

function reorderFeedsByUnreadStatus(feedsData) {
  if (feedsData.length === 0) return;

  const feedSections = document.querySelectorAll(".feed-section");
  if (feedSections.length === 0) return;

  const parent = feedSections[0].parentNode;
  if (!parent) return;

  const footer = parent.querySelector(".footer");

  const feedsWithUnread = feedsData
    .filter((f) => f.unreadCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const feedsAllRead = feedsData
    .filter((f) => f.unreadCount === 0 && (f.count || 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const emptyFeeds = feedsData
    .filter((f) => (f.count || 0) === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const orderedFeeds = [...feedsWithUnread, ...feedsAllRead, ...emptyFeeds];
  reorderDOMElements(orderedFeeds, parent, footer);
}

function setupMarkAsReadControls() {
  const resetButton = document.getElementById("reset-read-button");
  if (resetButton) {
    const newButton = resetButton.cloneNode(true);
    resetButton.parentNode.replaceChild(newButton, resetButton);

    newButton.addEventListener(
      "click",
      function handleResetClick(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
          const confirmed = window.confirm(
            "Are you sure you want to clear all read articles? This will mark all articles as unread and restore the original feed order.",
          );

          if (confirmed === true) {
            resetAllReadArticles();
          }
        } catch (error) {
          console.error("Error in reset button handler:", error);
          resetAllReadArticles();
        }

        return false;
      },
      { passive: false, capture: true },
    );
  }
}

function initializeMarkAsReadFeature() {
  initializeReadStatus();
  updateFeedCountsAfterReadFilter();
  setupMarkAsReadControls();
}

document.addEventListener("DOMContentLoaded", initializeMarkAsReadFeature);

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initializeMarkAsReadFeature, 0);
}

// ===== FEED FILTERING =====

function getEnabledFeeds() {
  return getLocalStorageJSON("enabledFeeds", null);
}

function applyFeedFilter() {
  const enabledFeeds = getEnabledFeeds();

  if (!enabledFeeds || enabledFeeds.length === 0) {
    return;
  }

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const linkText = link.textContent.trim();
    if (linkText === "All Feeds" || linkText === "Summary") {
      return;
    }

    if (!enabledFeeds.includes(linkText)) {
      link.style.display = "none";
    } else {
      link.style.display = "";
    }
  });

  const feedSections = document.querySelectorAll(".feed-section");
  feedSections.forEach((section) => {
    const heading = section.querySelector("h3");
    if (!heading) return;

    const feedNameElement = heading.childNodes[0];
    const feedName = feedNameElement
      ? feedNameElement.textContent.trim()
      : heading.textContent.trim();

    if (!enabledFeeds.includes(feedName)) {
      section.style.display = "none";
      section.setAttribute("data-hidden-by-filter", "true");
    } else {
      section.style.display = "";
      section.removeAttribute("data-hidden-by-filter");
    }
  });

  updateStats();
}

function initializeFeedFilter() {
  applyFeedFilter();
}

document.addEventListener("DOMContentLoaded", initializeFeedFilter);

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initializeFeedFilter, 0);
}

window.addEventListener("storage", (e) => {
  if (e.key === "enabledFeeds") {
    applyFeedFilter();
  }
});

// ===== ACCESSIBILITY ENHANCEMENTS =====

/**
 * Initialize accessibility features across the application
 */
function initAccessibility() {
  // Add keyboard navigation for settings menu items
  const settingsMenuItems = document.querySelectorAll('.settings-menu-item');
  settingsMenuItems.forEach(item => {
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Add keyboard support for article items to mark as read
  const articleItems = document.querySelectorAll('.article-item');
  articleItems.forEach(item => {
    const link = item.querySelector('.article-title');
    if (link) {
      // Add keyboard event for marking as read (Ctrl+R or Cmd+R)
      item.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
          e.preventDefault();
          // Toggle read status
          this.classList.toggle('read');
          const articleUrl = link.href;
          markArticleAsRead(articleUrl);
          announceToScreenReader('Article marked as ' + (this.classList.contains('read') ? 'read' : 'unread'));
        }
      });
    }
  });

  // Ensure proper focus management
  enhanceFocusManagement();
  
  // Add ARIA live region if not exists
  addAriaLiveRegion();
  
  // Prevent flash of transitions on page load
  preventInitialTransitions();
}

/**
 * Announce messages to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

/**
 * Add ARIA live region for dynamic announcements
 */
function addAriaLiveRegion() {
  if (!document.getElementById('aria-live-region')) {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
}

/**
 * Enhance focus management for better keyboard navigation
 */
function enhanceFocusManagement() {
  // Trap focus in modal-like elements (if any)
  const modals = document.querySelectorAll('[role="dialog"]');
  modals.forEach(modal => {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  });
}

/**
 * Prevent flash of transitions on initial page load
 */
function preventInitialTransitions() {
  document.body.classList.add('preload');
  setTimeout(() => {
    document.body.classList.remove('preload');
  }, 100);
}

/**
 * Update article count with screen reader announcement
 * @param {number} count - Number of visible articles
 * @param {string} filterName - Name of current filter
 */
function updateArticleCountAccessible(count, filterName) {
  announceToScreenReader(`Showing ${count} articles for ${filterName}`, 'polite');
}

/**
 * Enhance timeframe selector with announcements
 */
function enhanceTimeframeSelector() {
  const timeframeSelect = document.getElementById('timeframe-select');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex].text;
      announceToScreenReader(`Filter changed to ${selectedOption}`, 'polite');
    });
  }
}

/**
 * Enhance view mode selector with announcements
 */
function enhanceViewModeSelector() {
  const viewSelect = document.getElementById('view-select');
  if (viewSelect) {
    viewSelect.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex].text;
      announceToScreenReader(`View mode changed to ${selectedOption}`, 'polite');
    });
  }
}

// Initialize accessibility features when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initAccessibility();
    enhanceTimeframeSelector();
    enhanceViewModeSelector();
  });
} else {
  initAccessibility();
  enhanceTimeframeSelector();
  enhanceViewModeSelector();
}

// ===== TOUCH TARGET ENHANCEMENTS =====

/**
 * Ensure all interactive elements meet minimum touch target size
 */
function ensureTouchTargets() {
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, [role="button"], .article-item'
  );
  
  interactiveElements.forEach(element => {
    const rect = element.getBoundingClientRect();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      const minSize = 48; // 48px for mobile devices
      
      // Add padding if element is too small
      if (rect.height < minSize || rect.width < minSize) {
        const currentPadding = window.getComputedStyle(element).padding;
        if (currentPadding === '0px' || currentPadding === '') {
          element.style.padding = '0.75rem';
        }
      }
    }
  });
}

// Run touch target check after page load
window.addEventListener('load', ensureTouchTargets);

// ===== IMPROVED ERROR HANDLING WITH ACCESSIBILITY =====

/**
 * Display accessible error messages
 * @param {string} message - Error message to display
 * @param {string} severity - 'error', 'warning', or 'info'
 */
function displayAccessibleError(message, severity = 'error') {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.setAttribute('role', severity === 'error' ? 'alert' : 'status');
    errorContainer.setAttribute('aria-live', severity === 'error' ? 'assertive' : 'polite');
    errorContainer.textContent = message;
    
    // Auto-dismiss after 5 seconds for non-critical messages
    if (severity !== 'error') {
      setTimeout(() => {
        errorContainer.textContent = '';
      }, 5000);
    }
  }
  
  // Also announce to screen readers
  announceToScreenReader(message, severity === 'error' ? 'assertive' : 'polite');
}

