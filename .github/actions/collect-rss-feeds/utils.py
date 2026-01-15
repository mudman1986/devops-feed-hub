#!/usr/bin/env python3
"""
Shared utilities for RSS feed collection and summary generation
"""

from datetime import datetime
from typing import Any, Dict, List


def generate_feed_slug(feed_name: str) -> str:
    """
    Generate a URL-safe slug from a feed name

    Args:
            feed_name: The feed name

    Returns:
            URL-safe slug string
    """
    feed_slug = feed_name.lower().replace(" ", "-").replace("/", "-")
    # Remove any other non-alphanumeric characters except hyphens
    feed_slug = "".join(c if c.isalnum() or c == "-" else "" for c in feed_slug)
    # Remove consecutive hyphens
    while "--" in feed_slug:
        feed_slug = feed_slug.replace("--", "-")
    # Remove leading/trailing hyphens
    feed_slug = feed_slug.strip("-")
    return feed_slug


def parse_iso_timestamp(iso_string: str) -> datetime:
    """
    Parse ISO 8601 timestamp string to datetime object.

    Args:
        iso_string: ISO 8601 formatted timestamp string (may end with 'Z')

    Returns:
        datetime object
    """
    return datetime.fromisoformat(iso_string.replace("Z", "+00:00"))


def get_article_sort_key(article: Dict[str, Any]) -> datetime:
    """
    Get sort key for article by publication date.
    
    Args:
        article: Article dictionary with 'published' field
    
    Returns:
        datetime object for sorting (datetime.min if no valid date)
    """
    pub_date = article.get("published", "")
    if pub_date and pub_date != "Unknown":
        try:
            return parse_iso_timestamp(pub_date)
        except (ValueError, AttributeError):
            return datetime.min
    return datetime.min


def sort_articles_by_date(
    articles: List[Dict[str, Any]], reverse: bool = True
) -> List[Dict[str, Any]]:
    """
    Sort articles by publication date.
    
    Args:
        articles: List of article dictionaries
        reverse: If True, sort newest first (default)
    
    Returns:
        Sorted list of articles
    """
    return sorted(articles, key=get_article_sort_key, reverse=reverse)
