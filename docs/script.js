/* eslint-env browser */

// Mark as Read constants
const READ_ARTICLES_KEY = 'readArticles'

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle')
const htmlElement = document.documentElement

// Get saved theme preference or default to dark
let savedTheme = 'dark'
try {
  savedTheme = localStorage.getItem('theme') || 'dark'
} catch (e) {
  // localStorage might be unavailable (privacy mode, quota exceeded, etc.)
  console.warn('localStorage unavailable, using default theme:', e)
}

htmlElement.setAttribute('data-theme', savedTheme)

if (themeToggle) {
  updateThemeButton(savedTheme)

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'

    htmlElement.setAttribute('data-theme', newTheme)

    try {
      localStorage.setItem('theme', newTheme)
    } catch (e) {
      // localStorage might be unavailable, theme will reset on reload
      console.warn('Unable to save theme preference:', e)
    }

    updateThemeButton(newTheme)
  })
}

function updateThemeButton (theme) {
  const iconSVG = document.getElementById('theme-icon')
  const themeText = document.getElementById('theme-text')

  if (!iconSVG || !themeText) return

  if (theme === 'dark') {
    // Sun icon for light mode
    iconSVG.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
    themeText.textContent = 'Light Mode'
  } else {
    // Moon icon for dark mode
    iconSVG.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
    themeText.textContent = 'Dark Mode'
  }
}

// View selector functionality (compact/comfortable)
const viewSelect = document.getElementById('view-select')

// Get saved view preference or default to comfortable
let savedView = 'comfortable'
try {
  savedView = localStorage.getItem('view') || 'comfortable'
} catch (e) {
  // localStorage might be unavailable (privacy mode, quota exceeded, etc.)
  console.warn('localStorage unavailable, using default view:', e)
}

// Set dropdown value and apply view
if (viewSelect) {
  viewSelect.value = savedView
  applyView(savedView)

  // Add change listener to dropdown
  viewSelect.addEventListener('change', () => {
    const view = viewSelect.value

    // Save preference
    try {
      localStorage.setItem('view', view)
    } catch (e) {
      console.warn('Unable to save view preference:', e)
    }

    // Apply view
    applyView(view)
  })
}

function applyView (view) {
  if (view === 'compact') {
    htmlElement.setAttribute('data-view', 'compact')
  } else {
    htmlElement.removeAttribute('data-view')
  }
}

// Initialize sidebar state based on screen size
function initializeSidebarState (sidebar) {
  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed')
  } else {
    sidebar.classList.remove('collapsed')
  }
}

// Sidebar toggle functionality (mobile)
const sidebarToggle = document.getElementById('nav-toggle')
const sidebar = document.getElementById('sidebar')

if (sidebarToggle && sidebar) {
  // Set initial state
  initializeSidebarState(sidebar)

  // Handle window resize
  window.addEventListener('resize', () => initializeSidebarState(sidebar))

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed')
  })

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add('collapsed')
      }
    }
  })
}

// Timeframe filtering configuration
// Maps timeframe keys to hours for date filtering
const TIMEFRAME_HOURS = {
  '1day': 24,
  '7days': 168,
  '30days': 720
}

// Timeframe filtering functionality with dropdown
const timeframeSelect = document.getElementById('timeframe-select')

// Get saved timeframe preference or default to 1 day
let savedTimeframe = '1day'
try {
  savedTimeframe = localStorage.getItem('timeframe') || '1day'
} catch (e) {
  console.warn('localStorage unavailable, using default timeframe:', e)
}

// Set dropdown value and apply filter
if (timeframeSelect) {
  timeframeSelect.value = savedTimeframe
  applyTimeframeFilter(savedTimeframe)

  // Add change listener to dropdown
  timeframeSelect.addEventListener('change', () => {
    const timeframe = timeframeSelect.value

    // Save preference
    try {
      localStorage.setItem('timeframe', timeframe)
    } catch (e) {
      console.warn('Unable to save timeframe preference:', e)
    }

    // Apply filter
    applyTimeframeFilter(timeframe)
  })
}

function applyTimeframeFilter (timeframe) {
  const hours = TIMEFRAME_HOURS[timeframe] || 24
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

  // Filter articles by timeframe
  const allArticles = document.querySelectorAll('.article-item')

  allArticles.forEach((article) => {
    const publishedISO = article.getAttribute('data-published')
    if (publishedISO) {
      try {
        // Parse the ISO timestamp from data-published attribute
        const publishDate = new Date(publishedISO)
        if (!isNaN(publishDate.getTime())) {
          if (publishDate >= cutoffTime) {
            article.removeAttribute('data-hidden-by-timeframe')
            article.style.display = ''
          } else {
            article.setAttribute('data-hidden-by-timeframe', 'true')
            article.style.display = 'none'
          }
        } else {
          // If date parsing fails, show the article
          article.removeAttribute('data-hidden-by-timeframe')
          article.style.display = ''
        }
      } catch (e) {
        // If there's an error, show the article
        article.removeAttribute('data-hidden-by-timeframe')
        article.style.display = ''
      }
    } else {
      // Show articles without dates
      article.removeAttribute('data-hidden-by-timeframe')
      article.style.display = ''
    }
  })

  // Update feed counts and show/hide feed sections
  const feedSections = document.querySelectorAll('.feed-section')
  const feedsData = []

  feedSections.forEach((section) => {
    const articles = section.querySelectorAll('.article-item')
    const visibleArticles = Array.from(articles).filter(
      (a) => a.style.display !== 'none'
    )
    const count = visibleArticles.length

    // Update count badge
    const countBadge = section.querySelector('.feed-count')
    if (countBadge) {
      const plural = count !== 1 ? 's' : ''
      countBadge.textContent = `${count} article${plural}`
    }

    // Show "no articles" message if no visible articles
    const noArticlesMsg = section.querySelector('.no-articles')
    const articleList = section.querySelector('.article-list')

    if (count === 0) {
      if (articleList) articleList.style.display = 'none'
      if (!noArticlesMsg) {
        const msg = document.createElement('div')
        msg.className = 'no-articles'
        msg.textContent = 'No new articles in this time period'
        section.appendChild(msg)
      } else {
        noArticlesMsg.style.display = ''
      }
    } else {
      if (articleList) articleList.style.display = ''
      if (noArticlesMsg) noArticlesMsg.style.display = 'none'
    }

    // Store feed data for reordering
    feedsData.push({
      element: section,
      count,
      name: section.querySelector('h3')?.textContent.trim() || ''
    })
  })

  // Reorder feeds: feeds with articles first, then empty feeds (both groups alphabetically)
  if (feedSections.length > 0 && feedSections[0].parentNode) {
    const parent = feedSections[0].parentNode
    const footer = parent.querySelector('.footer')

    // Separate feeds into two groups
    const feedsWithArticles = feedsData
      .filter((f) => f.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
    const emptyFeeds = feedsData
      .filter((f) => f.count === 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    // Combine: feeds with articles first, then empty feeds
    const orderedFeeds = [...feedsWithArticles, ...emptyFeeds]

    // Reorder DOM elements - insert before footer to keep footer at bottom
    orderedFeeds.forEach((feedData) => {
      if (footer) {
        parent.insertBefore(feedData.element, footer)
      } else {
        parent.appendChild(feedData.element)
      }
    })
  }

  // Update metadata display
  updateMetadataDisplay()

  // Update stats if on main page
  updateStats()
}

function updateMetadataDisplay () {
  // Kept for compatibility with generated HTML pages that may reference this function
  // Metadata display functionality has been moved to CSS (display: none)
}

function updateStats () {
  const statCards = document.querySelectorAll('.stat-card')
  if (statCards.length === 0) return

  // Count visible articles across all feeds
  const allArticles = document.querySelectorAll('.article-item')
  const visibleArticles = Array.from(allArticles).filter(
    (a) => a.style.display !== 'none'
  )

  // Update total articles stat if it exists
  statCards.forEach((card) => {
    const label = card.querySelector('.stat-label')
    if (label && label.textContent === 'Total Articles') {
      const value = card.querySelector('.stat-value')
      if (value) {
        value.textContent = visibleArticles.length
      }
    }
  })
}

// Mark as Read functionality - constants defined at top of file

// Store original feed order for restoration when read status is reset
const originalFeedOrder = []

// Get read articles from localStorage
function getReadArticles () {
  try {
    const stored = localStorage.getItem(READ_ARTICLES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.warn('Unable to load read articles:', e)
    return []
  }
}

// Save read articles to localStorage
function saveReadArticles (readArticles) {
  try {
    localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles))
  } catch (e) {
    console.warn('Unable to save read articles:', e)
  }
}

// Check if an article is read
function isArticleRead (articleUrl) {
  const readArticles = getReadArticles()
  return readArticles.includes(articleUrl)
}

// Toggle read status of an article
function toggleArticleRead (articleUrl) {
  let readArticles = getReadArticles()

  if (readArticles.includes(articleUrl)) {
    // Remove from read list
    readArticles = readArticles.filter((url) => url !== articleUrl)
  } else {
    // Add to read list
    readArticles.push(articleUrl)
  }

  saveReadArticles(readArticles)
  // Return true if article is now read, false if unread
  return readArticles.includes(articleUrl)
}

// Reset all read articles
function resetAllReadArticles () {
  try {
    localStorage.removeItem(READ_ARTICLES_KEY)
    initializeReadStatus()
    // Restore original feed order when reset
    restoreOriginalFeedOrder()
    updateFeedCountsAfterReadFilter()
  } catch (e) {
    console.warn('Unable to reset read articles:', e)
  }
}

// Initialize read status for all articles
function initializeReadStatus () {
  const articles = document.querySelectorAll('.article-item')

  articles.forEach((article) => {
    const link = article.querySelector('.article-title')
    if (!link) return

    const articleUrl = link.getAttribute('href')
    if (!articleUrl) return

    // Remove existing read indicator if present
    const existingIndicator = article.querySelector('.read-indicator')
    if (existingIndicator) {
      existingIndicator.remove()
    }

    // Create read indicator (checkmark icon)
    const indicator = document.createElement('button')
    indicator.className = 'read-indicator'
    indicator.setAttribute('aria-label', 'Mark as read/unread')
    indicator.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`

    // Add click handler
    indicator.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      toggleArticleRead(articleUrl)
      updateArticleReadState(article, articleUrl)
      updateFeedCountsAfterReadFilter()
    })

    // Insert indicator at the beginning of the article
    article.insertBefore(indicator, article.firstChild)

    // Update initial state
    updateArticleReadState(article, articleUrl)
  })
}

// Update the visual state of an article based on read status
function updateArticleReadState (article, articleUrl) {
  const indicator = article.querySelector('.read-indicator')
  const isRead = isArticleRead(articleUrl)

  if (isRead) {
    article.classList.add('read')
    if (indicator) indicator.classList.add('active')
  } else {
    article.classList.remove('read')
    if (indicator) indicator.classList.remove('active')
  }
}

// Update feed counts after read status changes
function updateFeedCountsAfterReadFilter () {
  const feedSections = document.querySelectorAll('.feed-section')
  const feedsData = []

  feedSections.forEach((section) => {
    const articleList = section.querySelector('.article-list')
    if (!articleList) return

    const articles = section.querySelectorAll('.article-item')
    const visibleArticles = Array.from(articles).filter(
      (a) => a.style.display !== 'none'
    )

    // Count unread articles (not just visible)
    const unreadArticles = Array.from(articles).filter((article) => {
      const link = article.querySelector('.article-title')
      if (!link) return false
      const articleUrl = link.getAttribute('href')
      return !isArticleRead(articleUrl) && !article.hasAttribute('data-hidden-by-timeframe')
    })

    const count = visibleArticles.length
    const unreadCount = unreadArticles.length

    // Reorder articles within this feed: unread first, then read
    reorderArticlesInFeed(articleList, articles)

    // Update count badge
    const countBadge = section.querySelector('.feed-count')
    if (countBadge) {
      const plural = count !== 1 ? 's' : ''
      countBadge.textContent = `${count} article${plural}`
    }

    // Update no articles message
    const noArticlesMsg = section.querySelector('.no-articles')

    if (count === 0) {
      if (articleList) articleList.style.display = 'none'
      if (!noArticlesMsg) {
        const msg = document.createElement('div')
        msg.className = 'no-articles'
        msg.textContent = 'No articles to display'
        section.appendChild(msg)
      } else {
        noArticlesMsg.style.display = ''
      }
    } else {
      if (articleList) articleList.style.display = ''
      if (noArticlesMsg) noArticlesMsg.style.display = 'none'
    }

    // Store feed data for reordering
    feedsData.push({
      element: section,
      unreadCount,
      name: section.querySelector('h3')?.textContent.trim() || ''
    })
  })

  // Reorder feeds based on unread count
  reorderFeedsByUnreadStatus(feedsData)

  // Update stats
  updateStats()
}

// Reorder articles within a feed: unread articles first, then read articles
function reorderArticlesInFeed (articleList, articles) {
  if (!articleList || articles.length === 0) return

  // Separate articles into unread and read
  const articleData = Array.from(articles).map((article) => {
    const link = article.querySelector('.article-title')
    const articleUrl = link ? link.getAttribute('href') : null
    const isRead = articleUrl ? isArticleRead(articleUrl) : false

    return {
      element: article,
      isRead,
      articleUrl
    }
  })

  // Separate into two groups: unread first, read second
  const unreadArticles = articleData.filter(a => !a.isRead)
  const readArticles = articleData.filter(a => a.isRead)

  // Combine: unread articles first, then read articles
  const orderedArticles = [...unreadArticles, ...readArticles]

  // Reorder DOM elements within the article list
  orderedArticles.forEach((articleData) => {
    articleList.appendChild(articleData.element)
  })
}

// Reorder feeds: feeds with unread articles first, then feeds with all read articles
function reorderFeedsByUnreadStatus (feedsData) {
  if (feedsData.length === 0) return

  const feedSections = document.querySelectorAll('.feed-section')
  if (feedSections.length === 0) return

  const parent = feedSections[0].parentNode
  if (!parent) return

  const footer = parent.querySelector('.footer')

  // Separate feeds into two groups based on unread articles
  const feedsWithUnread = feedsData
    .filter((f) => f.unreadCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
  const feedsAllRead = feedsData
    .filter((f) => f.unreadCount === 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Combine: feeds with unread first, then all-read feeds
  const orderedFeeds = [...feedsWithUnread, ...feedsAllRead]

  // Reorder DOM elements - insert before footer to keep footer at bottom
  orderedFeeds.forEach((feedData) => {
    if (footer) {
      parent.insertBefore(feedData.element, footer)
    } else {
      parent.appendChild(feedData.element)
    }
  })
}

// Store and restore original feed order
function captureOriginalFeedOrder () {
  if (originalFeedOrder.length > 0) return // Already captured

  const feedSections = document.querySelectorAll('.feed-section')
  feedSections.forEach((section) => {
    originalFeedOrder.push({
      element: section,
      name: section.querySelector('h3')?.textContent.trim() || ''
    })
  })
}

function restoreOriginalFeedOrder () {
  if (originalFeedOrder.length === 0) return

  const parent = originalFeedOrder[0].element.parentNode
  if (!parent) return

  const footer = parent.querySelector('.footer')

  // Restore original order
  originalFeedOrder.forEach((feedData) => {
    if (footer) {
      parent.insertBefore(feedData.element, footer)
    } else {
      parent.appendChild(feedData.element)
    }
  })
}

// Set up UI controls for mark as read feature
function setupMarkAsReadControls () {
  // Set up Clear All Read button
  const resetButton = document.getElementById('reset-read-button')
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (
        confirm(
          'Are you sure you want to clear all read articles? This will mark all articles as unread and restore the original feed order.'
        )
      ) {
        resetAllReadArticles()
      }
    })
  }
}

// Initialize mark as read feature
function initializeMarkAsReadFeature () {
  // Capture original feed order before any modifications
  captureOriginalFeedOrder()
  initializeReadStatus()
  updateFeedCountsAfterReadFilter()
  setupMarkAsReadControls()
}

// Initialize mark as read feature when page loads
document.addEventListener('DOMContentLoaded', initializeMarkAsReadFeature)

// Also initialize if DOMContentLoaded has already fired
if (
  document.readyState === 'complete' ||
  document.readyState === 'interactive'
) {
  setTimeout(initializeMarkAsReadFeature, 0)
}
