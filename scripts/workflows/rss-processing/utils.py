#!/usr/bin/env python3
"""
Shared utilities for RSS feed collection and summary generation
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

DEFAULT_SITE_METADATA = {
    "site_name": "DevOps Feed Hub",
    "site_description": "Centralized RSS feed aggregator for DevOps and tech news",
    "header_title": "DevOps Feed Hub",
    "rss_title": "DevOps Feed Hub - All Articles",
    "rss_description": (
        "Aggregated DevOps, cloud, and technology news from multiple sources"
    ),
    "rss_generator": "DevOps Feed Hub RSS Generator",
}


def populate_derived_site_metadata(metadata: Dict[str, str]) -> Dict[str, str]:
    """
    Populate derived metadata fields from the base site metadata values.

    Args:
        metadata: Metadata dictionary containing the base site fields.

    Returns:
        Metadata dictionary with derived fields populated.
    """
    resolved_metadata = metadata.copy()
    site_name = resolved_metadata["site_name"]
    header_title = resolved_metadata.get("header_title") or site_name

    resolved_metadata["header_title"] = header_title
    resolved_metadata["summary_markdown_title"] = f"# 📰 {site_name} Summary"
    resolved_metadata["settings_title"] = f"Settings - {site_name}"
    resolved_metadata["settings_description"] = (
        f"{site_name} Settings - Configure your RSS feed preferences"
    )

    return resolved_metadata


def load_site_metadata(site_metadata_path: Optional[str] = None) -> Dict[str, str]:
    """
    Load site metadata configuration with defaults and derived values.

    Args:
        site_metadata_path: Optional path to a JSON metadata file.

    Returns:
        Metadata dictionary with defaults and derived values populated.

    Raises:
        ValueError: If the metadata file exists but is invalid.
    """
    metadata = DEFAULT_SITE_METADATA.copy()
    metadata_path = Path(site_metadata_path or "config/site-metadata.json")

    if metadata_path.is_file():
        try:
            with metadata_path.open("r", encoding="utf-8") as file:
                loaded_metadata = json.load(file)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Invalid JSON in site metadata file '{metadata_path}': {exc}"
            ) from exc
        except OSError as exc:
            raise ValueError(
                f"Unable to read site metadata file '{metadata_path}': {exc}"
            ) from exc

        if not isinstance(loaded_metadata, dict):
            raise ValueError(
                f"Site metadata file '{metadata_path}' must contain a JSON object"
            )

        for key in DEFAULT_SITE_METADATA:
            value = loaded_metadata.get(key)
            if isinstance(value, str) and value.strip():
                metadata[key] = value.strip()

    return populate_derived_site_metadata(metadata)


def resolve_site_metadata(
    site_metadata: Optional[Dict[str, str]] = None,
    site_metadata_path: Optional[str] = None,
) -> Dict[str, str]:
    """
    Resolve site metadata by merging optional overrides into loaded defaults.

    Args:
        site_metadata: Optional metadata overrides.
        site_metadata_path: Optional path to a JSON metadata file.

    Returns:
        Metadata dictionary with defaults, overrides, and derived values populated.
    """
    metadata = load_site_metadata(site_metadata_path)

    if isinstance(site_metadata, dict):
        for key in DEFAULT_SITE_METADATA:
            value = site_metadata.get(key)
            if isinstance(value, str) and value.strip():
                metadata[key] = value.strip()

    return populate_derived_site_metadata(metadata)


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
