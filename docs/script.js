// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;

// Get saved theme preference or default to dark
let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("theme") || "dark";
} catch (e) {
  // localStorage might be unavailable (privacy mode, quota exceeded, etc.)
  console.warn("localStorage unavailable, using default theme:", e);
}

htmlElement.setAttribute("data-theme", savedTheme);
updateThemeButton(savedTheme);

themeToggle.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  htmlElement.setAttribute("data-theme", newTheme);

  try {
    localStorage.setItem("theme", newTheme);
  } catch (e) {
    // localStorage might be unavailable, theme will reset on reload
    console.warn("Unable to save theme preference:", e);
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
    themeText.textContent = "Light Mode";
  } else {
    // Moon icon for dark mode
    iconSVG.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    themeText.textContent = "Dark Mode";
  }
}

// Initialize sidebar state based on screen size
function initializeSidebarState(sidebar) {
  if (window.innerWidth <= 768) {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
}

// Sidebar toggle functionality (mobile)
const sidebarToggle = document.getElementById("nav-toggle");
const sidebar = document.getElementById("sidebar");

if (sidebarToggle && sidebar) {
  // Set initial state
  initializeSidebarState(sidebar);

  // Handle window resize
  window.addEventListener("resize", () => initializeSidebarState(sidebar));

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add("collapsed");
      }
    }
  });
}

// Timeframe filtering configuration
// Maps timeframe keys to hours for date filtering
const TIMEFRAME_HOURS = {
  "1day": 24,
  "7days": 168,
  "30days": 720,
};

// Timeframe filtering functionality with dropdown
const timeframeSelect = document.getElementById("timeframe-select");

// Get saved timeframe preference or default to 1 day
let savedTimeframe = "1day";
try {
  savedTimeframe = localStorage.getItem("timeframe") || "1day";
} catch (e) {
  console.warn("localStorage unavailable, using default timeframe:", e);
}

// Set dropdown value and apply filter
if (timeframeSelect) {
  timeframeSelect.value = savedTimeframe;
  applyTimeframeFilter(savedTimeframe);

  // Add change listener to dropdown
  timeframeSelect.addEventListener("change", () => {
    const timeframe = timeframeSelect.value;

    // Save preference
    try {
      localStorage.setItem("timeframe", timeframe);
    } catch (e) {
      console.warn("Unable to save timeframe preference:", e);
    }

    // Apply filter
    applyTimeframeFilter(timeframe);
  });
}

function applyTimeframeFilter(timeframe) {
  const hours = TIMEFRAME_HOURS[timeframe] || 24;
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Filter articles by timeframe
  const allArticles = document.querySelectorAll(".article-item");

  allArticles.forEach((article) => {
    const publishedText = article.querySelector(".article-meta")?.textContent;
    if (publishedText) {
      try {
        // Parse the formatted date (e.g., "Jan 6, 2026 at 7:24 PM")
        const publishDate = new Date(publishedText);
        if (!isNaN(publishDate.getTime())) {
          if (publishDate >= cutoffTime) {
            article.style.display = "";
          } else {
            article.style.display = "none";
          }
        } else {
          // If date parsing fails, show the article
          article.style.display = "";
        }
      } catch (e) {
        // If there's an error, show the article
        article.style.display = "";
      }
    } else {
      // Show articles without dates
      article.style.display = "";
    }
  });

  // Update feed counts and show/hide feed sections
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
      if (noArticlesMsg) noArticlesMsg.style.display = "none";
    }

    // Store feed data for reordering
    feedsData.push({
      element: section,
      count: count,
      name: section.querySelector("h3")?.textContent.trim() || "",
    });
  });

  // Reorder feeds: feeds with articles first, then empty feeds (both groups alphabetically)
  if (feedSections.length > 0 && feedSections[0].parentNode) {
    const parent = feedSections[0].parentNode;
    const footer = parent.querySelector(".footer");

    // Separate feeds into two groups
    const feedsWithArticles = feedsData
      .filter((f) => f.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    const emptyFeeds = feedsData
      .filter((f) => f.count === 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Combine: feeds with articles first, then empty feeds
    const orderedFeeds = [...feedsWithArticles, ...emptyFeeds];

    // Reorder DOM elements - insert before footer to keep footer at bottom
    orderedFeeds.forEach((feedData) => {
      if (footer) {
        parent.insertBefore(feedData.element, footer);
      } else {
        parent.appendChild(feedData.element);
      }
    });
  }

  // Update metadata display
  updateMetadataDisplay();

  // Update stats if on main page
  updateStats();
}

function updateMetadataDisplay() {
  // Metadata is now hidden, but keep this function for compatibility
}

function updateStats() {
  const statCards = document.querySelectorAll(".stat-card");
  if (statCards.length === 0) return;

  // Count visible articles across all feeds
  const allArticles = document.querySelectorAll(".article-item");
  const visibleArticles = Array.from(allArticles).filter(
    (a) => a.style.display !== "none",
  );

  // Update total articles stat if it exists
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
