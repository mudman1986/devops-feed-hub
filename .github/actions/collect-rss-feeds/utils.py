#!/usr/bin/env python3
"""
Shared utilities for RSS feed collection and summary generation
"""


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
