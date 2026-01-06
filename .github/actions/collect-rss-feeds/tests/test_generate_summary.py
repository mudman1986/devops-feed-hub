#!/usr/bin/env python3
"""
Unit tests for generate_summary.py
Tests the summary generation functionality for RSS feed collection
"""

import unittest
import json
import tempfile
import os
from datetime import datetime, timezone


# Import the functions we want to test
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from generate_summary import generate_markdown_summary, generate_html_page


class TestGenerateSummary(unittest.TestCase):
    """Test cases for summary generation functions"""
    
    def setUp(self):
        """Set up test data"""
        self.sample_data = {
            'metadata': {
                'collected_at': '2024-01-15T10:30:00Z',
                'since': '2024-01-14T10:30:00Z',
                'hours': 24
            },
            'summary': {
                'total_feeds': 3,
                'successful_feeds': 2,
                'failed_feeds': 1,
                'total_articles': 5
            },
            'feeds': {
                'Test Blog 1': {
                    'url': 'https://example.com/feed1',
                    'count': 3,
                    'articles': [
                        {
                            'title': 'Article 1',
                            'link': 'https://example.com/article1',
                            'published': '2024-01-15T09:00:00Z'
                        },
                        {
                            'title': 'Article 2',
                            'link': 'https://example.com/article2',
                            'published': '2024-01-15T08:00:00Z'
                        },
                        {
                            'title': 'Article 3',
                            'link': 'https://example.com/article3',
                            'published': '2024-01-15T07:00:00Z'
                        }
                    ]
                },
                'Test Blog 2': {
                    'url': 'https://example.com/feed2',
                    'count': 2,
                    'articles': [
                        {
                            'title': 'Another Article',
                            'link': 'https://example.com/article4',
                            'published': '2024-01-15T06:00:00Z'
                        },
                        {
                            'title': 'Yet Another Article',
                            'link': 'https://example.com/article5',
                            'published': '2024-01-15T05:00:00Z'
                        }
                    ]
                }
            },
            'failed_feeds': [
                {
                    'name': 'Failed Feed',
                    'url': 'https://example.com/failed'
                }
            ]
        }
        
        self.empty_data = {
            'metadata': {
                'collected_at': '2024-01-15T10:30:00Z',
                'since': '2024-01-14T10:30:00Z',
                'hours': 24
            },
            'summary': {
                'total_feeds': 1,
                'successful_feeds': 1,
                'failed_feeds': 0,
                'total_articles': 0
            },
            'feeds': {
                'Empty Feed': {
                    'url': 'https://example.com/empty',
                    'count': 0,
                    'articles': []
                }
            },
            'failed_feeds': []
        }
    
    def test_generate_markdown_summary_basic(self):
        """Test basic markdown summary generation"""
        result = generate_markdown_summary(self.sample_data)
        
        # Check that result is a string
        self.assertIsInstance(result, str)
        
        # Check for key sections
        self.assertIn('# 📰 RSS Feed Collection Summary', result)
        self.assertIn('## 📊 Summary', result)
        self.assertIn('## ✅ Successful Feeds', result)
        self.assertIn('## ❌ Failed Feeds', result)
        
        # Check for metadata
        self.assertIn('Collected at:', result)
        self.assertIn('Time range:** Last 24 hours', result)
        
        # Check for summary stats
        self.assertIn('Total feeds:** 3', result)
        self.assertIn('Successful:** 2', result)
        self.assertIn('Failed:** 1', result)
        self.assertIn('Total articles:** 5', result)
    
    def test_generate_markdown_summary_feed_content(self):
        """Test that feed content is included in markdown"""
        result = generate_markdown_summary(self.sample_data)
        
        # Check for feed names
        self.assertIn('Test Blog 1', result)
        self.assertIn('Test Blog 2', result)
        
        # Check for article titles
        self.assertIn('Article 1', result)
        self.assertIn('Another Article', result)
        
        # Check for failed feed
        self.assertIn('Failed Feed', result)
    
    def test_generate_markdown_summary_empty_feeds(self):
        """Test markdown generation with empty feeds"""
        result = generate_markdown_summary(self.empty_data)
        
        # Should still have basic structure
        self.assertIn('# 📰 RSS Feed Collection Summary', result)
        self.assertIn('## 📊 Summary', result)
        
        # Should indicate no articles
        self.assertIn('Total articles:** 0', result)
        self.assertIn('*No new articles*', result)
        
        # Should not have failed feeds section
        self.assertNotIn('## ❌ Failed Feeds', result)
    
    def test_generate_html_page_basic(self):
        """Test basic HTML page generation"""
        result = generate_html_page(self.sample_data)
        
        # Check that result is a string
        self.assertIsInstance(result, str)
        
        # Check for HTML structure
        self.assertIn('<!DOCTYPE html>', result)
        self.assertIn('<html lang="en">', result)
        self.assertIn('</html>', result)
        
        # Check for key sections
        self.assertIn('<h1>📰 RSS Feed Collection</h1>', result)
        self.assertIn('<h2>📊 Summary</h2>', result)
        self.assertIn('<h2>✅ Feed Articles</h2>', result)
        self.assertIn('<h2>❌ Failed Feeds</h2>', result)
    
    def test_generate_html_page_content(self):
        """Test that HTML page includes all content"""
        result = generate_html_page(self.sample_data)
        
        # Check for feed names
        self.assertIn('Test Blog 1', result)
        self.assertIn('Test Blog 2', result)
        
        # Check for article titles
        self.assertIn('Article 1', result)
        self.assertIn('Another Article', result)
        
        # Check for article links
        self.assertIn('https://example.com/article1', result)
        self.assertIn('https://example.com/article4', result)
        
        # Check for failed feed
        self.assertIn('Failed Feed', result)
        self.assertIn('https://example.com/failed', result)
    
    def test_generate_html_page_stats(self):
        """Test that HTML page includes correct statistics"""
        result = generate_html_page(self.sample_data)
        
        # Check for stats values
        self.assertIn('>3</div>', result)  # total_feeds
        self.assertIn('>2</div>', result)  # successful_feeds
        self.assertIn('>1</div>', result)  # failed_feeds
        self.assertIn('>5</div>', result)  # total_articles
    
    def test_generate_html_page_responsive(self):
        """Test that HTML page includes responsive design"""
        result = generate_html_page(self.sample_data)
        
        # Check for viewport meta tag
        self.assertIn('name="viewport"', result)
        self.assertIn('width=device-width', result)
        
        # Check for CSS media query
        self.assertIn('@media (max-width: 768px)', result)
    
    def test_generate_html_page_empty_feeds(self):
        """Test HTML generation with empty feeds"""
        result = generate_html_page(self.empty_data)
        
        # Should still have basic structure
        self.assertIn('<!DOCTYPE html>', result)
        self.assertIn('<h1>📰 RSS Feed Collection</h1>', result)
        
        # Should indicate no articles
        self.assertIn('>0</div>', result)  # total_articles
        self.assertIn('No new articles', result)
        
        # Should not have failed feeds section
        self.assertNotIn('<h2>❌ Failed Feeds</h2>', result)
    
    def test_markdown_table_formatting(self):
        """Test that markdown tables are properly formatted"""
        result = generate_markdown_summary(self.sample_data)
        
        # Check for table headers
        self.assertIn('| Title | Published |', result)
        self.assertIn('|-------|-----------|', result)
    
    def test_html_escaping(self):
        """Test that special characters are properly escaped in HTML"""
        # Create data with special characters that need escaping
        special_data = self.sample_data.copy()
        special_data['feeds'] = {
            'Test Blog <script>': {
                'url': 'https://example.com/feed',
                'count': 1,
                'articles': [
                    {
                        'title': 'Article with <script>alert("XSS")</script>',
                        'link': 'https://example.com/article?test=1&other=2',
                        'published': '2024-01-15T09:00:00Z'
                    }
                ]
            }
        }
        
        result = generate_html_page(special_data)
        
        # The dangerous content should be escaped
        self.assertNotIn('<script>alert("XSS")</script>', result)
        self.assertIn('&lt;script&gt;', result)
        # Link special characters should be escaped
        self.assertIn('&amp;', result)
        # Feed name should be escaped
        self.assertIn('Test Blog &lt;script&gt;', result)
    
    def test_long_article_title_truncation(self):
        """Test that long article titles are truncated in markdown"""
        long_title_data = self.sample_data.copy()
        long_title = 'A' * 100  # 100 character title
        long_title_data['feeds']['Test Blog 1']['articles'][0]['title'] = long_title
        
        result = generate_markdown_summary(long_title_data)
        
        # Should be truncated with ellipsis
        self.assertIn('...', result)
    
    def test_multiple_articles_display_limit(self):
        """Test that markdown limits article display to 10 per feed"""
        # Create data with more than 10 articles
        many_articles_data = self.sample_data.copy()
        articles = [
            {
                'title': f'Article {i}',
                'link': f'https://example.com/article{i}',
                'published': '2024-01-15T09:00:00Z'
            }
            for i in range(15)
        ]
        many_articles_data['feeds']['Test Blog 1']['articles'] = articles
        many_articles_data['feeds']['Test Blog 1']['count'] = 15
        
        result = generate_markdown_summary(many_articles_data)
        
        # Should indicate there are more articles
        self.assertIn('...and 5 more articles', result)


class TestSummaryIntegration(unittest.TestCase):
    """Integration tests for summary generation"""
    
    def test_write_markdown_to_file(self):
        """Test writing markdown summary to a file"""
        sample_data = {
            'metadata': {
                'collected_at': '2024-01-15T10:30:00Z',
                'since': '2024-01-14T10:30:00Z',
                'hours': 24
            },
            'summary': {
                'total_feeds': 1,
                'successful_feeds': 1,
                'failed_feeds': 0,
                'total_articles': 1
            },
            'feeds': {
                'Test Feed': {
                    'url': 'https://example.com/feed',
                    'count': 1,
                    'articles': [
                        {
                            'title': 'Test Article',
                            'link': 'https://example.com/article',
                            'published': '2024-01-15T09:00:00Z'
                        }
                    ]
                }
            },
            'failed_feeds': []
        }
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.md') as f:
            markdown_file = f.name
        
        try:
            markdown_content = generate_markdown_summary(sample_data)
            with open(markdown_file, 'w') as f:
                f.write(markdown_content)
            
            # Verify file was written
            self.assertTrue(os.path.exists(markdown_file))
            
            # Verify content
            with open(markdown_file, 'r') as f:
                content = f.read()
            
            self.assertIn('Test Feed', content)
            self.assertIn('Test Article', content)
        finally:
            if os.path.exists(markdown_file):
                os.remove(markdown_file)
    
    def test_write_html_to_file(self):
        """Test writing HTML page to a file"""
        sample_data = {
            'metadata': {
                'collected_at': '2024-01-15T10:30:00Z',
                'since': '2024-01-14T10:30:00Z',
                'hours': 24
            },
            'summary': {
                'total_feeds': 1,
                'successful_feeds': 1,
                'failed_feeds': 0,
                'total_articles': 1
            },
            'feeds': {
                'Test Feed': {
                    'url': 'https://example.com/feed',
                    'count': 1,
                    'articles': [
                        {
                            'title': 'Test Article',
                            'link': 'https://example.com/article',
                            'published': '2024-01-15T09:00:00Z'
                        }
                    ]
                }
            },
            'failed_feeds': []
        }
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.html') as f:
            html_file = f.name
        
        try:
            html_content = generate_html_page(sample_data)
            with open(html_file, 'w') as f:
                f.write(html_content)
            
            # Verify file was written
            self.assertTrue(os.path.exists(html_file))
            
            # Verify content
            with open(html_file, 'r') as f:
                content = f.read()
            
            self.assertIn('<!DOCTYPE html>', content)
            self.assertIn('Test Feed', content)
            self.assertIn('Test Article', content)
        finally:
            if os.path.exists(html_file):
                os.remove(html_file)


if __name__ == '__main__':
    unittest.main()
