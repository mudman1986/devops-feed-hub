#!/usr/bin/env python3
"""
Summary Generator for RSS Feed Collection
Generates both markdown (for GitHub workflow summary) and HTML (for GitHub Pages)
"""

import argparse
import json
import os
from datetime import datetime
from html import escape as html_escape
from typing import Any, Dict


def parse_iso_timestamp(iso_string: str) -> datetime:
    """
    Parse ISO 8601 timestamp string to datetime object.

    Args:
        iso_string: ISO 8601 formatted timestamp string (may end with 'Z')

    Returns:
        datetime object
    """
    return datetime.fromisoformat(iso_string.replace("Z", "+00:00"))


def generate_markdown_summary(data: Dict[str, Any]) -> str:
    """
    Generate markdown summary from RSS feed collection data

    Args:
        data: RSS feed collection data dictionary

    Returns:
        Markdown formatted string
    """
    summary = []
    summary.append("# 📰 RSS Feed Collection Summary\n")
    summary.append(f"**Collected at:** {data['metadata']['collected_at']}\n")
    summary.append(f"**Time range:** Last {data['metadata']['hours']} hours\n")
    summary.append("")

    # Overall summary
    summary.append("## 📊 Summary\n")
    summary.append(f"- **Total feeds:** {data['summary']['total_feeds']}")
    summary.append(f"- **Successful:** {data['summary']['successful_feeds']}")
    summary.append(f"- **Failed:** {data['summary']['failed_feeds']}")
    summary.append(f"- **Total articles:** {data['summary']['total_articles']}")
    summary.append("")

    # Successful feeds
    if data["feeds"]:
        summary.append("## ✅ Successful Feeds\n")
        for feed_name, feed_data in data["feeds"].items():
            summary.append(f"### {feed_name}")
            summary.append(f"- **Articles:** {feed_data['count']}")

            if feed_data["articles"]:
                summary.append("\n| Title | Published |")
                summary.append("|-------|-----------|")
                for article in feed_data["articles"][:10]:  # Limit to first 10
                    title = (
                        article["title"][:80] + "..."
                        if len(article["title"]) > 80
                        else article["title"]
                    )
                    published = article["published"]
                    summary.append(f"| [{title}]({article['link']}) | {published} |")

                if feed_data["count"] > 10:
                    summary.append(
                        f"\n*...and {feed_data['count'] - 10} more articles*"
                    )
            else:
                summary.append("*No new articles*")

            summary.append("")

    # Failed feeds
    if data["failed_feeds"]:
        summary.append("## ❌ Failed Feeds\n")
        summary.append("| Feed Name | URL |")
        summary.append("|-----------|-----|")
        for failed in data["failed_feeds"]:
            summary.append(f"| {failed['name']} | {failed['url']} |")
        summary.append("")

    return "\n".join(summary)


def generate_feed_nav(
    feeds: Dict[str, Any], current_feed: str = None, has_failed_feeds: bool = False
) -> str:
    """
    Generate navigation links for feed pages

    Args:
        feeds: Dictionary of feed data
        current_feed: Name of current feed (if on a feed page), or "failed" for failed feeds page
        has_failed_feeds: Whether there are failed feeds to show

    Returns:
        HTML navigation string
    """
    nav_html = '<nav class="feed-nav">\n'
    nav_html += '  <a href="index.html" class="nav-link'
    if current_feed is None:
        nav_html += " active"
    nav_html += '">📊 All Feeds</a>\n'

    for feed_name in sorted(feeds.keys()):
        feed_slug = generate_feed_slug(feed_name)

        nav_html += f'  <a href="feed-{feed_slug}.html" class="nav-link'
        if current_feed == feed_name:
            nav_html += " active"
        nav_html += f'">{html_escape(feed_name)}</a>\n'

    # Add Failed Feeds link as last item if there are failed feeds
    if has_failed_feeds:
        nav_html += '  <a href="failed-feeds.html" class="nav-link'
        if current_feed == "failed":
            nav_html += " active"
        nav_html += '">❌ Failed Feeds</a>\n'

    nav_html += "</nav>\n"
    return nav_html


def generate_failed_feeds_content(failed_feeds: list) -> str:
    """
    Generate HTML content for failed feeds section

    Args:
        failed_feeds: List of failed feed dictionaries

    Returns:
        HTML content string for failed feeds
    """
    content = """
        <h2>❌ Failed Feeds</h2>
"""
    if failed_feeds:
        content += """
        <div class="failed-feeds">
"""
        for failed in failed_feeds:
            escaped_name = html_escape(failed["name"])
            escaped_url = html_escape(failed["url"])
            content += f"""
            <div class="failed-feed-item">
                <div class="failed-feed-name">{escaped_name}</div>
                <div class="failed-feed-url">{escaped_url}</div>
            </div>
"""
        content += """
        </div>
"""
    else:
        content += """
        <div class="no-articles">No failed feeds</div>
"""
    return content


def generate_feed_articles_content(feeds_to_display: Dict[str, Any]) -> str:
    """
    Generate HTML content for feed articles section

    Args:
        feeds_to_display: Dictionary of feeds to display

    Returns:
        HTML content string for feed articles
    """
    if not feeds_to_display:
        return ""

    content = """
        <h2>✅ Feed Articles</h2>
"""
    for feed_name, feed_data in feeds_to_display.items():
        article_count = feed_data["count"]
        escaped_feed_name = html_escape(feed_name)
        article_plural = "s" if article_count != 1 else ""
        content += f"""
        <div class="feed-section">
            <h3>{escaped_feed_name}
                <span class="feed-count">
                    {article_count} article{article_plural}
                </span>
            </h3>
"""
        if feed_data["articles"]:
            content += """
            <ul class="article-list">
"""
            for article in feed_data["articles"]:
                escaped_title = html_escape(article["title"])
                escaped_link = html_escape(article["link"])
                escaped_published = html_escape(article["published"])
                content += f"""
                <li class="article-item">
                    <a href="{escaped_link}" class="article-title"
                       target="_blank" rel="noopener noreferrer">
                        {escaped_title}
                    </a>
                    <div class="article-meta">Published: {escaped_published}</div>
                </li>
"""
            content += """
            </ul>
"""
        else:
            content += """
            <div class="no-articles">No new articles in this time period</div>
"""
        content += """
        </div>
"""
    return content


def generate_html_content(data: Dict[str, Any], current_feed: str = None) -> str:
    """
    Generate HTML content (without template wrapper) from RSS feed collection data

    Args:
        data: RSS feed collection data dictionary
        current_feed: If specified, generate content for only this feed,
                      or "failed" for failed feeds page

    Returns:
        HTML content string to be injected into template
    """
    collected_time = parse_iso_timestamp(data["metadata"]["collected_at"])
    formatted_time = collected_time.strftime("%B %d, %Y at %I:%M %p UTC")

    # Add navigation (check if there are failed feeds)
    has_failed_feeds = len(data.get("failed_feeds", [])) > 0
    content = generate_feed_nav(data["feeds"], current_feed, has_failed_feeds)

    content += f"""
        <div class="metadata">
            <strong>Last Updated:</strong> {formatted_time}<br>
            <strong>Time Range:</strong> Last {data['metadata']['hours']} hours
        </div>
"""

    # If showing failed feeds page
    if current_feed == "failed":
        content += generate_failed_feeds_content(data.get("failed_feeds", []))
        return content

    # If showing a single feed, adjust the summary
    if current_feed:
        feed_data = data["feeds"].get(current_feed, {})
        article_count = feed_data.get("count", 0)
        content += f"""
        <h2>📊 {html_escape(current_feed)}</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Total Articles</div>
                <div class="stat-value">{article_count}</div>
            </div>
        </div>
"""
    else:
        # Show overall summary for all feeds
        content += f"""
        <h2>📊 Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Total Feeds</div>
                <div class="stat-value">{data['summary']['total_feeds']}</div>
            </div>
            <div class="stat-card success">
                <div class="stat-label">Successful</div>
                <div class="stat-value">{data['summary']['successful_feeds']}</div>
            </div>
            <div class="stat-card error">
                <div class="stat-label">Failed</div>
                <div class="stat-value">{data['summary']['failed_feeds']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Articles</div>
                <div class="stat-value">{data['summary']['total_articles']}</div>
            </div>
        </div>
"""

    # Determine which feeds to display
    feeds_to_display = {}
    if current_feed:
        # Single feed view
        if current_feed in data["feeds"]:
            feeds_to_display = {current_feed: data["feeds"][current_feed]}
    else:
        # All feeds view - sort alphabetically
        feeds_to_display = dict(sorted(data["feeds"].items()))

    # Display feeds
    content += generate_feed_articles_content(feeds_to_display)

    return content


def generate_html_page(
    data: Dict[str, Any], template_path: str = None, current_feed: str = None
) -> str:
    """
    Generate complete HTML page from RSS feed collection data using template.

    Args:
        data: RSS feed collection data dictionary.
        template_path: Path to HTML template file (optional).
        current_feed: If specified, generate page for only this feed.

    Returns:
        Complete HTML page string.

    Raises:
        FileNotFoundError: If the specified template file does not exist.
        IOError: If an I/O error occurs while reading the template file.
        OSError: If a path-related or other OS-level error occurs when
            accessing the template file.
    """
    # Get template path
    if template_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        template_path = os.path.join(script_dir, "template.html")

    # Read template with error handling and explicit UTF-8 encoding
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read()
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            f"HTML template file not found at '{template_path}'. "
            "Ensure the template file exists and the path is correct."
        ) from exc
    except OSError as exc:
        raise OSError(
            f"Error reading HTML template file at '{template_path}': {exc}"
        ) from exc

    # Generate content
    content = generate_html_content(data, current_feed)

    # Get formatted timestamp
    collected_time = parse_iso_timestamp(data["metadata"]["collected_at"])
    formatted_time = collected_time.strftime("%B %d, %Y at %I:%M %p UTC")

    # Update title if this is a feed-specific page
    page_title = "RSS Feed Collection"
    if current_feed:
        page_title = f"{current_feed} - RSS Feed Collection"

    # Replace placeholders
    html = template.replace("<!-- CONTENT_PLACEHOLDER -->", content)
    html = html.replace("<!-- TIMESTAMP_PLACEHOLDER -->", formatted_time)
    html = html.replace(
        "<title>RSS Feed Collection</title>",
        f"<title>{html_escape(page_title)}</title>",
    )

    return html


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


def generate_all_pages(data: Dict[str, Any], output_dir: str) -> None:
    """
    Generate all HTML pages (main index + individual feed pages + failed feeds page)

    Args:
        data: RSS feed collection data dictionary
        output_dir: Directory to write HTML files

    Returns:
        None
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Generate main index page (all feeds)
    index_path = os.path.join(output_dir, "index.html")
    index_html = generate_html_page(data)
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"✓ Main index page written to {index_path}")

    # Generate individual feed pages (sorted alphabetically)
    for feed_name in sorted(data["feeds"].keys()):
        feed_slug = generate_feed_slug(feed_name)
        feed_path = os.path.join(output_dir, f"feed-{feed_slug}.html")
        feed_html = generate_html_page(data, current_feed=feed_name)
        with open(feed_path, "w", encoding="utf-8") as f:
            f.write(feed_html)
        print(f"✓ Feed page for '{feed_name}' written to {feed_path}")

    # Generate failed feeds page if there are failed feeds
    if data.get("failed_feeds"):
        failed_path = os.path.join(output_dir, "failed-feeds.html")
        failed_html = generate_html_page(data, current_feed="failed")
        with open(failed_path, "w", encoding="utf-8") as f:
            f.write(failed_html)
        print(f"✓ Failed feeds page written to {failed_path}")


def main():
    """
    Main entry point for the summary generator script.

    Parses command line arguments and generates markdown and/or HTML summaries
    from RSS feed collection data.

    Returns:
        int: 0 on success, 1 on error.
    """
    parser = argparse.ArgumentParser(
        description="Generate summary from RSS feed collection data"
    )
    parser.add_argument(
        "--input", required=True, help="Input JSON file from RSS feed collection"
    )
    parser.add_argument("--markdown", help="Output markdown file path")
    parser.add_argument("--html", help="Output HTML file path (for single page mode)")
    parser.add_argument(
        "--output-dir",
        help="Output directory for multi-page HTML (generates index + feed pages)",
    )

    args = parser.parse_args()

    # Read input JSON
    try:
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file {args.input} not found")
        return 1
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {args.input}: {e}")
        return 1

    # Generate markdown if requested
    if args.markdown:
        markdown_content = generate_markdown_summary(data)
        with open(args.markdown, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        print(f"✓ Markdown summary written to {args.markdown}")

    # Generate multi-page HTML if output directory is specified
    if args.output_dir:
        generate_all_pages(data, args.output_dir)

    # Generate single HTML page if requested (backward compatibility)
    elif args.html:
        html_content = generate_html_page(data)
        with open(args.html, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"✓ HTML page written to {args.html}")

    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
