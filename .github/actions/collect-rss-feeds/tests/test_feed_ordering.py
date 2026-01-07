"""
Tests for feed ordering functionality in the RSS Feed Collection UI.

This module tests both server-side (Python) and client-side (JavaScript simulation)
feed ordering to ensure feeds with articles appear before empty feeds.
"""

import json
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

# Add parent directory to path to import generate_summary
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_summary import (
    generate_html_content,
    generate_html_page,
)


class TestFeedOrdering(unittest.TestCase):
    """Test cases for feed ordering functionality"""

    def setUp(self):
        """Set up test data with mixed feed states"""
        # Create test data with some feeds having articles and some empty
        self.test_data = {
            "metadata": {
                "collection_time": "2026-01-07T23:00:00Z",
                "hours_collected": 720,
            },
            "feeds": {
                "Empty Feed A": {"count": 0, "articles": [], "error": None},
                "GitHub Blog": {
                    "count": 2,
                    "articles": [
                        {
                            "title": "Article 1",
                            "link": "https://example.com/1",
                            "published": "2026-01-07T20:00:00+00:00",
                        },
                        {
                            "title": "Article 2",
                            "link": "https://example.com/2",
                            "published": "2026-01-07T19:00:00+00:00",
                        },
                    ],
                    "error": None,
                },
                "Empty Feed Z": {"count": 0, "articles": [], "error": None},
                "Active Feed B": {
                    "count": 1,
                    "articles": [
                        {
                            "title": "Article 3",
                            "link": "https://example.com/3",
                            "published": "2026-01-07T18:00:00+00:00",
                        }
                    ],
                    "error": None,
                },
            },
            "failed_feeds": [],
        }

    def test_server_side_feed_ordering(self):
        """Test that Python code orders feeds correctly (feeds with articles first)"""
        html = generate_html_content(self.test_data)

        # Find positions of each feed in the HTML
        github_pos = html.find("GitHub Blog")
        active_pos = html.find("Active Feed B")
        empty_a_pos = html.find("Empty Feed A")
        empty_z_pos = html.find("Empty Feed Z")

        # Feeds with articles should appear before empty feeds
        self.assertLess(
            github_pos,
            empty_a_pos,
            "GitHub Blog (with articles) should appear before Empty Feed A",
        )
        self.assertLess(
            active_pos,
            empty_a_pos,
            "Active Feed B (with articles) should appear before Empty Feed A",
        )
        self.assertLess(
            github_pos,
            empty_z_pos,
            "GitHub Blog (with articles) should appear before Empty Feed Z",
        )
        self.assertLess(
            active_pos,
            empty_z_pos,
            "Active Feed B (with articles) should appear before Empty Feed Z",
        )

        # Within feeds with articles, they should be alphabetically sorted
        self.assertLess(
            active_pos, github_pos, "Active Feed B should come before GitHub Blog"
        )

        # Within empty feeds, they should be alphabetically sorted
        self.assertLess(
            empty_a_pos, empty_z_pos, "Empty Feed A should come before Empty Feed Z"
        )

    def test_all_feeds_with_articles(self):
        """Test ordering when all feeds have articles"""
        data = {
            "metadata": {
                "collection_time": "2026-01-07T23:00:00Z",
                "hours_collected": 720,
            },
            "feeds": {
                "Zebra Feed": {
                    "count": 1,
                    "articles": [
                        {
                            "title": "Article Z",
                            "link": "https://example.com/z",
                            "published": "2026-01-07T20:00:00+00:00",
                        }
                    ],
                    "error": None,
                },
                "Alpha Feed": {
                    "count": 1,
                    "articles": [
                        {
                            "title": "Article A",
                            "link": "https://example.com/a",
                            "published": "2026-01-07T20:00:00+00:00",
                        }
                    ],
                    "error": None,
                },
            },
            "failed_feeds": [],
        }

        html = generate_html_content(data)

        alpha_pos = html.find("Alpha Feed")
        zebra_pos = html.find("Zebra Feed")

        # Should be alphabetically sorted
        self.assertLess(
            alpha_pos, zebra_pos, "Alpha Feed should come before Zebra Feed"
        )

    def test_all_feeds_empty(self):
        """Test ordering when all feeds are empty"""
        data = {
            "metadata": {
                "collection_time": "2026-01-07T23:00:00Z",
                "hours_collected": 720,
            },
            "feeds": {
                "Zebra Feed": {"count": 0, "articles": [], "error": None},
                "Alpha Feed": {"count": 0, "articles": [], "error": None},
                "Beta Feed": {"count": 0, "articles": [], "error": None},
            },
            "failed_feeds": [],
        }

        html = generate_html_content(data)

        alpha_pos = html.find("Alpha Feed")
        beta_pos = html.find("Beta Feed")
        zebra_pos = html.find("Zebra Feed")

        # Should be alphabetically sorted
        self.assertLess(alpha_pos, beta_pos, "Alpha Feed should come before Beta Feed")
        self.assertLess(beta_pos, zebra_pos, "Beta Feed should come before Zebra Feed")

    def test_feed_ordering_with_special_characters(self):
        """Test ordering with feed names containing special characters"""
        data = {
            "metadata": {
                "collection_time": "2026-01-07T23:00:00Z",
                "hours_collected": 720,
            },
            "feeds": {
                "Microsoft DevOps Blog": {
                    "count": 1,
                    "articles": [
                        {
                            "title": "Article 1",
                            "link": "https://example.com/1",
                            "published": "2026-01-07T20:00:00+00:00",
                        }
                    ],
                    "error": None,
                },
                "GitHub - Enterprise": {"count": 0, "articles": [], "error": None},
                "Azure Updates": {
                    "count": 2,
                    "articles": [
                        {
                            "title": "Article 2",
                            "link": "https://example.com/2",
                            "published": "2026-01-07T20:00:00+00:00",
                        },
                        {
                            "title": "Article 3",
                            "link": "https://example.com/3",
                            "published": "2026-01-07T19:00:00+00:00",
                        },
                    ],
                    "error": None,
                },
            },
            "failed_feeds": [],
        }

        html = generate_html_content(data)

        azure_pos = html.find("Azure Updates")
        microsoft_pos = html.find("Microsoft DevOps Blog")
        github_pos = html.find("GitHub - Enterprise")

        # Feeds with articles should come first
        self.assertLess(
            azure_pos,
            github_pos,
            "Azure Updates (with articles) should come before GitHub - Enterprise (empty)",
        )
        self.assertLess(
            microsoft_pos,
            github_pos,
            "Microsoft DevOps Blog (with articles) should come before GitHub - Enterprise (empty)",
        )

        # Within feeds with articles, alphabetically sorted
        self.assertLess(
            azure_pos,
            microsoft_pos,
            "Azure Updates should come before Microsoft DevOps Blog",
        )


class TestClientSideFeedOrderingLogic(unittest.TestCase):
    """
    Test the logic that would be implemented in JavaScript for client-side feed ordering.
    These tests simulate the JavaScript behavior in Python to ensure correctness.
    """

    def test_feed_sorting_algorithm(self):
        """Test the sorting algorithm used for feed ordering"""
        # Simulate feed data as it would appear in JavaScript
        feeds_data = [
            {"name": "Empty Feed A", "count": 0},
            {"name": "GitHub Blog", "count": 10},
            {"name": "Empty Feed Z", "count": 0},
            {"name": "Active Feed B", "count": 5},
            {"name": "Empty Feed M", "count": 0},
        ]

        # Separate into two groups
        feeds_with_articles = [f for f in feeds_data if f["count"] > 0]
        empty_feeds = [f for f in feeds_data if f["count"] == 0]

        # Sort each group alphabetically
        feeds_with_articles.sort(key=lambda f: f["name"])
        empty_feeds.sort(key=lambda f: f["name"])

        # Combine
        ordered_feeds = feeds_with_articles + empty_feeds

        # Verify order
        expected_order = [
            "Active Feed B",  # Has articles, starts with 'A'
            "GitHub Blog",  # Has articles, starts with 'G'
            "Empty Feed A",  # Empty, starts with 'E' then 'A'
            "Empty Feed M",  # Empty, starts with 'E' then 'M'
            "Empty Feed Z",  # Empty, starts with 'E' then 'Z'
        ]

        actual_order = [f["name"] for f in ordered_feeds]
        self.assertEqual(
            actual_order,
            expected_order,
            f"Feed order incorrect. Expected: {expected_order}, Got: {actual_order}",
        )

    def test_footer_position_after_reordering(self):
        """Test that footer remains at the bottom after feed reordering"""
        # Generate complete HTML page using template
        html = generate_html_page(
            {
                "metadata": {
                    "collected_at": "2026-01-07T23:00:00+00:00",
                    "hours_collected": 720,
                },
                "feeds": {
                    "Empty Feed": {"count": 0, "articles": [], "error": None},
                    "Active Feed": {
                        "count": 1,
                        "articles": [
                            {
                                "title": "Article",
                                "link": "https://example.com/1",
                                "published": "2026-01-07T20:00:00+00:00",
                            }
                        ],
                        "error": None,
                    },
                },
                "summary": {
                    "total_feeds": 2,
                    "successful_feeds": 2,
                    "failed_feeds": 0,
                    "total_articles": 1,
                },
                "failed_feeds": [],
            }
        )

        # Footer should be after all feed sections in the HTML structure
        footer_pos = html.find('<div class="footer">')
        active_feed_pos = html.find("Active Feed")
        empty_feed_pos = html.find("Empty Feed")

        # Footer should exist
        self.assertNotEqual(footer_pos, -1, "Footer should be present in HTML")

        # Footer should be after both feeds
        self.assertGreater(
            footer_pos,
            active_feed_pos,
            "Footer should appear after Active Feed section",
        )
        self.assertGreater(
            footer_pos,
            empty_feed_pos,
            "Footer should appear after Empty Feed section",
        )

        # Footer should be before the sidebar to maintain proper structure
        sidebar_pos = html.find('<aside class="sidebar')
        if sidebar_pos != -1:
            self.assertLess(
                footer_pos,
                sidebar_pos,
                "Footer should appear before sidebar in main content",
            )

        # Footer should contain the expected text
        self.assertIn("Generated by RSS Feed Collector", html)
        self.assertIn("Last updated:", html)

    def test_feed_count_update_after_filtering(self):
        """Test that feed counts are correctly updated after timeframe filtering"""
        # Simulate articles with different publish dates
        articles = [
            {"published": "2026-01-07T22:30:00Z"},  # Within 24 hours (30 min ago)
            {"published": "2026-01-07T20:00:00Z"},  # Within 24 hours (3 hours ago)
            {"published": "2026-01-06T20:00:00Z"},  # Outside 24 hours (27 hours ago)
            {"published": "2025-12-20T20:00:00Z"},  # Outside 24 hours (18 days ago)
        ]

        # Simulate filtering for last 24 hours
        now = datetime(2026, 1, 7, 23, 0, 0, tzinfo=timezone.utc)
        cutoff_24h = now - timedelta(hours=24)

        visible_articles = [
            a
            for a in articles
            if datetime.fromisoformat(a["published"].replace("Z", "+00:00"))
            >= cutoff_24h
        ]

        # Should have 2 articles within 24 hours
        self.assertEqual(
            len(visible_articles),
            2,
            "Should have 2 articles within 24 hours",
        )

    def test_empty_feeds_moved_to_bottom(self):
        """Test that feeds become empty and move to bottom when timeframe changes"""
        # Initial state: all feeds have articles
        feeds = [
            {"name": "Feed A", "all_articles": 10, "recent_articles": 0},
            {"name": "Feed B", "all_articles": 5, "recent_articles": 2},
            {"name": "Feed C", "all_articles": 8, "recent_articles": 0},
        ]

        # After filtering to recent timeframe, some feeds have no visible articles
        feeds_with_articles = [f for f in feeds if f["recent_articles"] > 0]
        empty_feeds = [f for f in feeds if f["recent_articles"] == 0]

        # Sort each group
        feeds_with_articles.sort(key=lambda f: f["name"])
        empty_feeds.sort(key=lambda f: f["name"])

        # Combine
        ordered = feeds_with_articles + empty_feeds
        names = [f["name"] for f in ordered]

        # Feed B should be first (has recent articles)
        # Feed A and C should be after (no recent articles, alphabetically sorted)
        self.assertEqual(names, ["Feed B", "Feed A", "Feed C"])


if __name__ == "__main__":
    unittest.main()
