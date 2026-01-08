/**
 * @jest-environment jsdom
 */

/* eslint-env jest */

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Load the script content
const fs = require('fs')
const path = require('path')
const scriptContent = fs.readFileSync(
  path.join(__dirname, 'script.js'),
  'utf8'
)

describe('Mark as Read Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

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
    `

    // Execute the script functions we want to test
    eval(
      scriptContent
        .split('document.addEventListener')[0]
        .replace(/const /g, 'window.')
        .replace(/function /g, 'window.')
    )
  })

  describe('getReadArticles', () => {
    test('should return empty array when no articles are marked as read', () => {
      expect(window.getReadArticles()).toEqual([])
    })

    test('should return array of read article URLs from localStorage', () => {
      localStorage.setItem('readArticles', JSON.stringify(['url1', 'url2']))
      expect(window.getReadArticles()).toEqual(['url1', 'url2'])
    })

    test('should return empty array if localStorage is corrupted', () => {
      localStorage.setItem('readArticles', 'invalid json')
      expect(window.getReadArticles()).toEqual([])
    })
  })

  describe('saveReadArticles', () => {
    test('should save articles to localStorage', () => {
      window.saveReadArticles(['url1', 'url2'])
      expect(localStorage.getItem('readArticles')).toBe(
        JSON.stringify(['url1', 'url2'])
      )
    })
  })

  describe('isArticleRead', () => {
    test('should return false for unread article', () => {
      expect(window.isArticleRead('https://example.com/article1')).toBe(false)
    })

    test('should return true for read article', () => {
      localStorage.setItem(
        'readArticles',
        JSON.stringify(['https://example.com/article1'])
      )
      expect(window.isArticleRead('https://example.com/article1')).toBe(true)
    })
  })

  describe('toggleArticleRead', () => {
    test('should mark unread article as read', () => {
      const result = window.toggleArticleRead('https://example.com/article1')
      expect(result).toBe(true)
      expect(window.isArticleRead('https://example.com/article1')).toBe(true)
    })

    test('should mark read article as unread', () => {
      localStorage.setItem(
        'readArticles',
        JSON.stringify(['https://example.com/article1'])
      )
      const result = window.toggleArticleRead('https://example.com/article1')
      expect(result).toBe(false)
      expect(window.isArticleRead('https://example.com/article1')).toBe(false)
    })
  })

  describe('getHideReadPreference', () => {
    test('should return false by default', () => {
      expect(window.getHideReadPreference()).toBe(false)
    })

    test('should return true when preference is set', () => {
      localStorage.setItem('hideReadArticles', 'true')
      expect(window.getHideReadPreference()).toBe(true)
    })

    test('should return false when preference is explicitly false', () => {
      localStorage.setItem('hideReadArticles', 'false')
      expect(window.getHideReadPreference()).toBe(false)
    })
  })

  describe('saveHideReadPreference', () => {
    test('should save hide read preference', () => {
      window.saveHideReadPreference(true)
      expect(localStorage.getItem('hideReadArticles')).toBe('true')
    })
  })

  describe('resetAllReadArticles', () => {
    test('should clear all read articles from localStorage', () => {
      localStorage.setItem('readArticles', JSON.stringify(['url1', 'url2']))
      window.resetAllReadArticles()
      expect(localStorage.getItem('readArticles')).toBeNull()
    })
  })
})

describe('Filter Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = `
      <div class="feed-section">
        <h3>Test Feed <span class="feed-count">2 articles</span></h3>
        <ul class="article-list">
          <li class="article-item">
            <a href="https://example.com/article1" class="article-title">Article 1</a>
            <div class="article-meta">Jan 08, 2026 at 12:00 PM</div>
          </li>
          <li class="article-item">
            <a href="https://example.com/article2" class="article-title">Article 2</a>
            <div class="article-meta">Jan 01, 2020 at 12:00 PM</div>
          </li>
        </ul>
      </div>
    `
  })

  describe('Bug Fix: Hide read filter with timeframe filter', () => {
    test('should not show read articles when both filters are active', () => {
      // Mark article1 as read
      localStorage.setItem(
        'readArticles',
        JSON.stringify(['https://example.com/article1'])
      )
      localStorage.setItem('hideReadArticles', 'true')

      // Simulate timeframe filter marking article2 as hidden
      const article2 = document.querySelectorAll('.article-item')[1]
      article2.setAttribute('data-hidden-by-timeframe', 'true')
      article2.style.display = 'none'

      // Apply read filter
      eval(scriptContent.match(/function applyReadFilter[\s\S]*?^}/m)[0])
      window.applyReadFilter()

      // Article 1 should be hidden (marked as read)
      const article1 = document.querySelectorAll('.article-item')[0]
      expect(article1.style.display).toBe('none')
      expect(article1.getAttribute('data-hidden-by-read')).toBe('true')

      // Article 2 should remain hidden (by timeframe filter)
      expect(article2.style.display).toBe('none')
      expect(article2.getAttribute('data-hidden-by-timeframe')).toBe('true')
    })

    test('should show unread articles when hide read filter is disabled', () => {
      localStorage.setItem(
        'readArticles',
        JSON.stringify(['https://example.com/article1'])
      )
      localStorage.setItem('hideReadArticles', 'false')

      eval(scriptContent.match(/function applyReadFilter[\s\S]*?^}/m)[0])
      window.applyReadFilter()

      const article1 = document.querySelectorAll('.article-item')[0]
      expect(article1.getAttribute('data-hidden-by-read')).toBeNull()
    })

    test('should correctly handle toggling multiple articles', () => {
      localStorage.setItem('hideReadArticles', 'true')

      eval(scriptContent.match(/function toggleArticleRead[\s\S]*?^}/m)[0])
      eval(scriptContent.match(/function applyReadFilter[\s\S]*?^}/m)[0])

      // Mark first article as read
      window.toggleArticleRead('https://example.com/article1')
      window.applyReadFilter()

      let article1 = document.querySelectorAll('.article-item')[0]
      expect(article1.style.display).toBe('none')

      // Mark second article as read
      window.toggleArticleRead('https://example.com/article2')
      window.applyReadFilter()

      let article2 = document.querySelectorAll('.article-item')[1]
      expect(article2.style.display).toBe('none')

      // Unmark first article
      window.toggleArticleRead('https://example.com/article1')
      window.applyReadFilter()

      article1 = document.querySelectorAll('.article-item')[0]
      expect(article1.style.display).toBe('')
      expect(article1.getAttribute('data-hidden-by-read')).toBeNull()

      // Second should still be hidden
      article2 = document.querySelectorAll('.article-item')[1]
      expect(article2.style.display).toBe('none')
    })
  })
})
