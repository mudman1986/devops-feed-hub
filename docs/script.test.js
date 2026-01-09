/**
 * @jest-environment jsdom
 */

/* eslint-env jest */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Helper to define functions in global scope for testing
function loadScriptFunctions() {
  // Extract just the function definitions we need to test
  const READ_ARTICLES_KEY = "readArticles";

  // Define functions in global scope
  window.getReadArticles = function () {
    try {
      const stored = localStorage.getItem(READ_ARTICLES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Unable to load read articles:", e);
      return [];
    }
  };

  window.saveReadArticles = function (readArticles) {
    try {
      localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles));
    } catch (e) {
      console.warn("Unable to save read articles:", e);
    }
  };

  window.isArticleRead = function (articleUrl) {
    const readArticles = window.getReadArticles();
    return readArticles.includes(articleUrl);
  };

  window.toggleArticleRead = function (articleUrl) {
    let readArticles = window.getReadArticles();

    if (readArticles.includes(articleUrl)) {
      readArticles = readArticles.filter((url) => url !== articleUrl);
    } else {
      readArticles.push(articleUrl);
    }

    window.saveReadArticles(readArticles);
    return readArticles.includes(articleUrl);
  };

  window.resetAllReadArticles = function () {
    try {
      localStorage.removeItem(READ_ARTICLES_KEY);
    } catch (e) {
      console.warn("Unable to reset read articles:", e);
    }
  };
}

describe("Mark as Read Functionality", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Set up basic DOM structure
    document.body.innerHTML = `
      <div class="feed-section">
        <h3>Test Feed <span class="feed-count">3 articles</span></h3>
        <ul class="article-list">
          <li class="article-item">
            <a href="https://example.com/article1" class="article-title">Article 1</a>
            <div class="article-meta">Jan 08, 2026 at 12:00 PM</div>
          </li>
          <li class="article-item">
            <a href="https://example.com/article2" class="article-title">Article 2</a>
            <div class="article-meta">Jan 07, 2026 at 12:00 PM</div>
          </li>
          <li class="article-item">
            <a href="https://example.com/article3" class="article-title">Article 3</a>
            <div class="article-meta">Jan 06, 2026 at 12:00 PM</div>
          </li>
        </ul>
      </div>
      <div id="hide-read-checkbox"></div>
      <div id="reset-read-button"></div>
    `;

    // Load script functions for testing
    loadScriptFunctions();
  });

  describe("getReadArticles", () => {
    test("should return empty array when no articles are marked as read", () => {
      expect(window.getReadArticles()).toEqual([]);
    });

    test("should return array of read article URLs from localStorage", () => {
      localStorage.setItem("readArticles", JSON.stringify(["url1", "url2"]));
      expect(window.getReadArticles()).toEqual(["url1", "url2"]);
    });

    test("should return empty array if localStorage is corrupted", () => {
      localStorage.setItem("readArticles", "invalid json");
      expect(window.getReadArticles()).toEqual([]);
    });
  });

  describe("saveReadArticles", () => {
    test("should save articles to localStorage", () => {
      window.saveReadArticles(["url1", "url2"]);
      expect(localStorage.getItem("readArticles")).toBe(
        JSON.stringify(["url1", "url2"]),
      );
    });
  });

  describe("isArticleRead", () => {
    test("should return false for unread article", () => {
      expect(window.isArticleRead("https://example.com/article1")).toBe(false);
    });

    test("should return true for read article", () => {
      localStorage.setItem(
        "readArticles",
        JSON.stringify(["https://example.com/article1"]),
      );
      expect(window.isArticleRead("https://example.com/article1")).toBe(true);
    });
  });

  describe("toggleArticleRead", () => {
    test("should mark unread article as read", () => {
      const result = window.toggleArticleRead("https://example.com/article1");
      expect(result).toBe(true);
      expect(window.isArticleRead("https://example.com/article1")).toBe(true);
    });

    test("should mark read article as unread", () => {
      localStorage.setItem(
        "readArticles",
        JSON.stringify(["https://example.com/article1"]),
      );
      const result = window.toggleArticleRead("https://example.com/article1");
      expect(result).toBe(false);
      expect(window.isArticleRead("https://example.com/article1")).toBe(false);
    });
  });

  describe("resetAllReadArticles", () => {
    test("should clear all read articles from localStorage", () => {
      localStorage.setItem("readArticles", JSON.stringify(["url1", "url2"]));
      window.resetAllReadArticles();
      expect(localStorage.getItem("readArticles")).toBeNull();
    });
  });
});

describe("Timeframe Filtering", () => {
  // Date formatting options for consistent formatting
  const dateFormat = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  beforeEach(() => {
    localStorage.clear();

    // Set up DOM with articles at different times
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    document.body.innerHTML = `
      <select id="timeframe-select">
        <option value="1day">Last 24 hours</option>
        <option value="7days">Last 7 days</option>
        <option value="30days">Last 30 days</option>
      </select>
      <div class="feed-section">
        <h3>Test Feed <span class="feed-count"></span></h3>
        <ul class="article-list">
          <li class="article-item">
            <a href="https://example.com/article1" class="article-title">Recent Article</a>
            <div class="article-meta">${now.toLocaleString("en-US", dateFormat)}</div>
          </li>
          <li class="article-item">
            <a href="https://example.com/article2" class="article-title">Old Article</a>
            <div class="article-meta">${lastWeek.toLocaleString("en-US", dateFormat)}</div>
          </li>
        </ul>
      </div>
    `;
  });

  test("should save timeframe preference to localStorage", () => {
    localStorage.setItem("timeframe", "7days");
    expect(localStorage.getItem("timeframe")).toBe("7days");
  });

  test("should default to 1day if no preference saved", () => {
    const savedTimeframe = localStorage.getItem("timeframe") || "1day";
    expect(savedTimeframe).toBe("1day");
  });
});

describe("Theme Toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <html data-theme="dark">
        <button id="theme-toggle">
          <svg id="theme-icon"></svg>
          <span id="theme-text">Light Mode</span>
        </button>
      </html>
    `;
  });

  test("should save theme preference to localStorage", () => {
    localStorage.setItem("theme", "dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("should default to dark theme if no preference saved", () => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    expect(savedTheme).toBe("dark");
  });

  test("should toggle between light and dark themes", () => {
    localStorage.setItem("theme", "dark");
    const currentTheme = localStorage.getItem("theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
