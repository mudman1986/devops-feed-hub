#!/usr/bin/env python3
"""
Summary Generator for RSS Feed Collection
Generates both markdown (for GitHub workflow summary) and HTML (for GitHub Pages)
"""

import json
import argparse
from datetime import datetime
from typing import Dict, Any, List


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


def generate_html_page(data: Dict[str, Any]) -> str:
    """
    Generate HTML page from RSS feed collection data
    
    Args:
        data: RSS feed collection data dictionary
        
    Returns:
        HTML formatted string
    """
    collected_time = datetime.fromisoformat(data['metadata']['collected_at'].replace('Z', '+00:00'))
    formatted_time = collected_time.strftime('%B %d, %Y at %I:%M %p UTC')
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="RSS Feed Collection - Latest articles from tech blogs and news sources">
    <title>RSS Feed Collection</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            background-color: #f6f8fa;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }}
        
        h1 {{
            color: #0366d6;
            margin-bottom: 10px;
            font-size: 2em;
        }}
        
        h2 {{
            color: #24292e;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e1e4e8;
            font-size: 1.5em;
        }}
        
        h3 {{
            color: #0366d6;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.2em;
        }}
        
        .metadata {{
            color: #586069;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f6f8fa;
            border-radius: 6px;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        
        .stat-card {{
            padding: 20px;
            background-color: #f6f8fa;
            border-radius: 6px;
            border-left: 4px solid #0366d6;
        }}
        
        .stat-card.success {{
            border-left-color: #28a745;
        }}
        
        .stat-card.error {{
            border-left-color: #d73a49;
        }}
        
        .stat-label {{
            font-size: 0.9em;
            color: #586069;
            margin-bottom: 5px;
        }}
        
        .stat-value {{
            font-size: 2em;
            font-weight: bold;
            color: #24292e;
        }}
        
        .feed-section {{
            margin-bottom: 30px;
        }}
        
        .article-list {{
            list-style: none;
            margin-top: 10px;
        }}
        
        .article-item {{
            padding: 12px;
            margin-bottom: 8px;
            background-color: #f6f8fa;
            border-radius: 6px;
            transition: background-color 0.2s;
        }}
        
        .article-item:hover {{
            background-color: #e1e4e8;
        }}
        
        .article-title {{
            color: #0366d6;
            text-decoration: none;
            font-weight: 500;
            display: block;
            margin-bottom: 5px;
        }}
        
        .article-title:hover {{
            text-decoration: underline;
        }}
        
        .article-meta {{
            font-size: 0.9em;
            color: #586069;
        }}
        
        .feed-count {{
            display: inline-block;
            background-color: #0366d6;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            margin-left: 10px;
        }}
        
        .failed-feeds {{
            background-color: #fff5f5;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #d73a49;
        }}
        
        .failed-feed-item {{
            padding: 8px;
            margin-bottom: 5px;
        }}
        
        .failed-feed-name {{
            font-weight: 500;
            color: #d73a49;
        }}
        
        .failed-feed-url {{
            font-size: 0.9em;
            color: #586069;
            word-break: break-all;
        }}
        
        .no-articles {{
            color: #586069;
            font-style: italic;
            padding: 10px;
        }}
        
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e1e4e8;
            text-align: center;
            color: #586069;
            font-size: 0.9em;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 20px;
            }}
            
            h1 {{
                font-size: 1.5em;
            }}
            
            h2 {{
                font-size: 1.3em;
            }}
            
            .stats {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📰 RSS Feed Collection</h1>
        
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
        html += """
        <h2>✅ Feed Articles</h2>
"""
        for feed_name, feed_data in data['feeds'].items():
            article_count = feed_data['count']
            html += f"""
        <div class="feed-section">
            <h3>{feed_name}<span class="feed-count">{article_count} article{'s' if article_count != 1 else ''}</span></h3>
"""
            if feed_data['articles']:
                html += """
            <ul class="article-list">
"""
                for article in feed_data['articles']:
                    title = article['title']
                    link = article['link']
                    published = article['published']
                    html += f"""
                <li class="article-item">
                    <a href="{link}" class="article-title" target="_blank" rel="noopener noreferrer">{title}</a>
                    <div class="article-meta">Published: {published}</div>
                </li>
"""
                html += """
            </ul>
"""
            else:
                html += """
            <div class="no-articles">No new articles in this time period</div>
"""
            html += """
        </div>
"""
    
    # Failed feeds
    if data['failed_feeds']:
        html += """
        <h2>❌ Failed Feeds</h2>
        <div class="failed-feeds">
"""
        for failed in data['failed_feeds']:
            html += f"""
            <div class="failed-feed-item">
                <div class="failed-feed-name">{failed['name']}</div>
                <div class="failed-feed-url">{failed['url']}</div>
            </div>
"""
        html += """
        </div>
"""
    
    html += f"""
        <div class="footer">
            Generated by RSS Feed Collector | Last updated: {formatted_time}
        </div>
    </div>
</body>
</html>
"""
    
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
