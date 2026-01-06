#!/usr/bin/env python3
"""
Summary Generator for RSS Feed Collection
Generates both markdown (for GitHub workflow summary) and HTML (for GitHub Pages)
"""

import json
import argparse
import os
from html import escape as html_escape
from datetime import datetime
from typing import Dict, Any


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
    if data['feeds']:
        summary.append("## ✅ Successful Feeds\n")
        for feed_name, feed_data in data['feeds'].items():
            summary.append(f"### {feed_name}")
            summary.append(f"- **Articles:** {feed_data['count']}")

            if feed_data['articles']:
                summary.append("\n| Title | Published |")
                summary.append("|-------|-----------|")
                for article in feed_data['articles'][:10]:  # Limit to first 10
                    title = article['title'][:80] + "..." if len(article['title']) > 80 else article['title']
                    published = article['published']
                    summary.append(f"| [{title}]({article['link']}) | {published} |")

                if feed_data['count'] > 10:
                    summary.append(f"\n*...and {feed_data['count'] - 10} more articles*")
            else:
                summary.append("*No new articles*")

            summary.append("")

    # Failed feeds
    if data['failed_feeds']:
        summary.append("## ❌ Failed Feeds\n")
        summary.append("| Feed Name | URL |")
        summary.append("|-----------|-----|")
        for failed in data['failed_feeds']:
            summary.append(f"| {failed['name']} | {failed['url']} |")
        summary.append("")

    return '\n'.join(summary)


def generate_html_content(data: Dict[str, Any]) -> str:
    """
    Generate HTML content (without template wrapper) from RSS feed collection data

    Args:
        data: RSS feed collection data dictionary

    Returns:
        HTML content string to be injected into template
    """
    collected_time = datetime.fromisoformat(data['metadata']['collected_at'].replace('Z', '+00:00'))
    formatted_time = collected_time.strftime('%B %d, %Y at %I:%M %p UTC')

    content = f"""
        <div class="metadata">
            <strong>Last Updated:</strong> {formatted_time}<br>
            <strong>Time Range:</strong> Last {data['metadata']['hours']} hours
        </div>

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

    # Successful feeds
    if data['feeds']:
        content += """
        <h2>✅ Feed Articles</h2>
"""
        for feed_name, feed_data in data['feeds'].items():
            article_count = feed_data['count']
            escaped_feed_name = html_escape(feed_name)
            article_plural = 's' if article_count != 1 else ''
            content += f"""
        <div class="feed-section">
            <h3>{escaped_feed_name}
                <span class="feed-count">
                    {article_count} article{article_plural}
                </span>
            </h3>
"""
            if feed_data['articles']:
                content += """
            <ul class="article-list">
"""
                for article in feed_data['articles']:
                    escaped_title = html_escape(article['title'])
                    escaped_link = html_escape(article['link'])
                    escaped_published = html_escape(article['published'])
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

    # Failed feeds
    if data['failed_feeds']:
        content += """
        <h2>❌ Failed Feeds</h2>
        <div class="failed-feeds">
"""
        for failed in data['failed_feeds']:
            escaped_name = html_escape(failed['name'])
            escaped_url = html_escape(failed['url'])
            content += f"""
            <div class="failed-feed-item">
                <div class="failed-feed-name">{escaped_name}</div>
                <div class="failed-feed-url">{escaped_url}</div>
            </div>
"""
        content += """
        </div>
"""

    return content


def generate_html_page(data: Dict[str, Any], template_path: str = None) -> str:
    """
    Generate complete HTML page from RSS feed collection data using template.

    Args:
        data: RSS feed collection data dictionary.
        template_path: Path to HTML template file (optional).

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
        template_path = os.path.join(script_dir, 'template.html')

    # Read template with error handling and explicit UTF-8 encoding
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
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
    content = generate_html_content(data)

    # Get formatted timestamp
    collected_time = datetime.fromisoformat(
        data['metadata']['collected_at'].replace('Z', '+00:00')
    )
    formatted_time = collected_time.strftime('%B %d, %Y at %I:%M %p UTC')

    # Replace placeholders
    html = template.replace('<!-- CONTENT_PLACEHOLDER -->', content)
    html = html.replace('<!-- TIMESTAMP_PLACEHOLDER -->', formatted_time)

    return html


def main():
    parser = argparse.ArgumentParser(description='Generate summary from RSS feed collection data')
    parser.add_argument('--input', required=True, help='Input JSON file from RSS feed collection')
    parser.add_argument('--markdown', help='Output markdown file path')
    parser.add_argument('--html', help='Output HTML file path')

    args = parser.parse_args()

    # Read input JSON
    try:
        with open(args.input, 'r') as f:
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
        with open(args.markdown, 'w') as f:
            f.write(markdown_content)
        print(f"✓ Markdown summary written to {args.markdown}")

    # Generate HTML if requested
    if args.html:
        html_content = generate_html_page(data)
        with open(args.html, 'w') as f:
            f.write(html_content)
        print(f"✓ HTML page written to {args.html}")

    return 0


if __name__ == '__main__':
    exit(main())
