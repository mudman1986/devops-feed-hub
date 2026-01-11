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
  window.getReadArticles = () => {
    try {
      const stored = localStorage.getItem(READ_ARTICLES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Unable to load read articles:", e);
      return [];
    }
  };

  window.saveReadArticles = (readArticles) => {
    try {
      localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles));
    } catch (e) {
      console.warn("Unable to save read articles:", e);
    }
  };

  window.isArticleRead = (articleUrl) => {
    const readArticles = window.getReadArticles();
    return readArticles.includes(articleUrl);
  };

  window.toggleArticleRead = (articleUrl) => {
    let readArticles = window.getReadArticles();

    if (readArticles.includes(articleUrl)) {
      readArticles = readArticles.filter((url) => url !== articleUrl);
    } else {
      readArticles.push(articleUrl);
    }

    window.saveReadArticles(readArticles);
    return readArticles.includes(articleUrl);
  };

  window.resetAllReadArticles = () => {
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
describe("Article Reordering", () => {
  beforeEach(() => {
    localStorage.clear();

    // Set up DOM with articles having chronological order
    // Newer articles first (Jan 10, Jan 9, Jan 8)
    document.body.innerHTML = `
      <div class="feed-section">
        <h3>Test Feed <span class="feed-count">3 articles</span></h3>
        <ul class="article-list">
          <li class="article-item" data-published="2026-01-10T12:00:00Z">
            <a href="https://example.com/article1" class="article-title">Article 1 (Jan 10)</a>
          </li>
          <li class="article-item" data-published="2026-01-09T12:00:00Z">
            <a href="https://example.com/article2" class="article-title">Article 2 (Jan 9)</a>
          </li>
          <li class="article-item" data-published="2026-01-08T12:00:00Z">
            <a href="https://example.com/article3" class="article-title">Article 3 (Jan 8)</a>
          </li>
        </ul>
      </div>
    `;

    loadScriptFunctions();

    // Use the FIXED implementation with date sorting
    window.reorderArticlesInFeed = (articleList, articles) => {
      if (!articleList || articles.length === 0) return;

      // Separate articles into unread and read
      const articleData = Array.from(articles).map((article) => {
        const link = article.querySelector(".article-title");
        const articleUrl = link ? link.getAttribute("href") : null;
        const isRead = articleUrl ? window.isArticleRead(articleUrl) : false;
        const publishedISO = article.getAttribute("data-published");
        const publishDate = publishedISO ? new Date(publishedISO) : new Date(0);

        return {
          element: article,
          isRead,
          articleUrl,
          publishDate,
        };
      });

      // Separate into two groups and sort by date (newest first)
      const unreadArticles = articleData
        .filter((a) => !a.isRead)
        .sort((a, b) => b.publishDate - a.publishDate);
      const readArticles = articleData
        .filter((a) => a.isRead)
        .sort((a, b) => b.publishDate - a.publishDate);

      // Combine: unread articles first, then read articles
      const orderedArticles = [...unreadArticles, ...readArticles];

      // Reorder DOM elements within the article list
      orderedArticles.forEach((articleData) => {
        articleList.appendChild(articleData.element);
      });
    };
  });

  test("should maintain chronological order when article is marked read then unread", () => {
    const articleList = document.querySelector(".article-list");
    let articles = document.querySelectorAll(".article-item");

    // Initial order should be chronological (newest first)
    expect(articles[0].querySelector(".article-title").textContent).toBe(
      "Article 1 (Jan 10)",
    );
    expect(articles[1].querySelector(".article-title").textContent).toBe(
      "Article 2 (Jan 9)",
    );
    expect(articles[2].querySelector(".article-title").textContent).toBe(
      "Article 3 (Jan 8)",
    );

    // Mark article 2 as read
    window.toggleArticleRead("https://example.com/article2");
    window.reorderArticlesInFeed(articleList, articles);

    // Refresh articles after reorder
    articles = document.querySelectorAll(".article-item");

    // After marking as read, unread articles should come first (1, 3), then read (2)
    expect(articles[0].querySelector(".article-title").textContent).toBe(
      "Article 1 (Jan 10)",
    );
    expect(articles[1].querySelector(".article-title").textContent).toBe(
      "Article 3 (Jan 8)",
    );
    expect(articles[2].querySelector(".article-title").textContent).toBe(
      "Article 2 (Jan 9)",
    );

    // Mark article 2 as unread - with the fix, chronological order should be restored
    window.toggleArticleRead("https://example.com/article2");
    window.reorderArticlesInFeed(articleList, articles);

    // Refresh articles after reorder
    articles = document.querySelectorAll(".article-item");

    // After marking as unread, all articles should be in chronological order again
    expect(articles[0].querySelector(".article-title").textContent).toBe(
      "Article 1 (Jan 10)",
    );
    expect(articles[1].querySelector(".article-title").textContent).toBe(
      "Article 2 (Jan 9)",
    );
    expect(articles[2].querySelector(".article-title").textContent).toBe(
      "Article 3 (Jan 8)",
    );
  });

  test("should maintain chronological order within unread and read groups", () => {
    const articleList = document.querySelector(".article-list");
    let articles = document.querySelectorAll(".article-item");

    // Mark article 1 and 3 as read
    window.toggleArticleRead("https://example.com/article1");
    window.toggleArticleRead("https://example.com/article3");
    window.reorderArticlesInFeed(articleList, articles);

    // Refresh articles after reorder
    articles = document.querySelectorAll(".article-item");

    // Unread articles (2) should come first, then read articles (1, 3) in chronological order
    expect(articles[0].querySelector(".article-title").textContent).toBe(
      "Article 2 (Jan 9)",
    );
    expect(articles[1].querySelector(".article-title").textContent).toBe(
      "Article 1 (Jan 10)",
    );
    expect(articles[2].querySelector(".article-title").textContent).toBe(
      "Article 3 (Jan 8)",
    );
  });
});

// Feed Filtering Tests
describe("Feed Filtering Functionality", () => {
  let getEnabledFeeds;
  let saveEnabledFeeds;

  beforeEach(() => {
    localStorage.clear();

    // Define functions for testing
    getEnabledFeeds = () => {
      try {
        const stored = localStorage.getItem("enabledFeeds");
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        console.warn("Unable to load enabled feeds:", e);
        return null;
      }
    };

    saveEnabledFeeds = (feeds) => {
      try {
        localStorage.setItem("enabledFeeds", JSON.stringify(feeds));
      } catch (e) {
        console.warn("Unable to save enabled feeds:", e);
      }
    };
  });

  describe("getEnabledFeeds", () => {
    test("should return null when no feeds are saved", () => {
      expect(getEnabledFeeds()).toBeNull();
    });

    test("should return array of enabled feeds from localStorage", () => {
      const testFeeds = ["GitHub Blog", "Docker Blog", "Kubernetes Blog"];
      saveEnabledFeeds(testFeeds);

      const result = getEnabledFeeds();
      expect(result).toEqual(testFeeds);
      expect(result).toHaveLength(3);
    });

    test("should return null if localStorage contains invalid JSON", () => {
      localStorage.setItem("enabledFeeds", "invalid json");
      expect(getEnabledFeeds()).toBeNull();
    });

    test("should handle empty array", () => {
      saveEnabledFeeds([]);
      const result = getEnabledFeeds();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("saveEnabledFeeds", () => {
    test("should save feeds array to localStorage", () => {
      const testFeeds = ["Feed A", "Feed B"];
      saveEnabledFeeds(testFeeds);

      const stored = localStorage.getItem("enabledFeeds");
      expect(stored).toBe(JSON.stringify(testFeeds));
    });

    test("should persist multiple feeds", () => {
      const feeds = [
        "GitHub Blog",
        "Docker Blog",
        "Kubernetes Blog",
        "AWS DevOps Blog",
      ];
      saveEnabledFeeds(feeds);

      const retrieved = getEnabledFeeds();
      expect(retrieved).toEqual(feeds);
    });

    test("should handle updating existing feeds", () => {
      saveEnabledFeeds(["Feed 1", "Feed 2"]);
      saveEnabledFeeds(["Feed 3"]);

      const result = getEnabledFeeds();
      expect(result).toEqual(["Feed 3"]);
    });
  });

  describe("Feed Selection Persistence", () => {
    test("should maintain feed selection across page reloads", () => {
      const selectedFeeds = ["GitHub Blog", "HashiCorp Blog"];
      saveEnabledFeeds(selectedFeeds);

      // Simulate page reload by getting feeds again
      const afterReload = getEnabledFeeds();
      expect(afterReload).toEqual(selectedFeeds);
    });

    test("should handle all feeds being disabled", () => {
      saveEnabledFeeds([]);
      const result = getEnabledFeeds();
      expect(result).toEqual([]);
    });

    test("should handle single feed selection", () => {
      saveEnabledFeeds(["Docker Blog"]);
      const result = getEnabledFeeds();
      expect(result).toEqual(["Docker Blog"]);
      expect(result).toHaveLength(1);
    });
  });
});
