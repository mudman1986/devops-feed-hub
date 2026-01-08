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

  describe('resetAllReadArticles', () => {
    test('should clear all read articles from localStorage', () => {
      localStorage.setItem('readArticles', JSON.stringify(['url1', 'url2']))
      window.resetAllReadArticles()
      expect(localStorage.getItem('readArticles')).toBeNull()
    })
  })
})
