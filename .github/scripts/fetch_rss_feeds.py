#!/usr/bin/env python3
"""
RSS Feed Fetcher and Formatter
Fetches articles from multiple RSS feeds and formats them for MS Teams
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
import argparse


def parse_rss_feed(url, since_time):
    """
    Parse an RSS feed and return articles published after since_time
    
    Args:
        url: RSS feed URL
        since_time: datetime object - only return articles after this time
    
    Returns:
        List of article dictionaries with 'title', 'link', 'pubDate'
    """
    articles = []
    
    try:
        # Add user agent to avoid 403 errors
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(req, timeout=30) as response:
            content = response.read()
        
        # Parse XML
        root = ET.fromstring(content)
        
        # Handle both RSS and Atom feeds
        if root.tag == '{http://www.w3.org/2005/Atom}feed':
            # Atom feed
            for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
                title_elem = entry.find('{http://www.w3.org/2005/Atom}title')
                link_elem = entry.find('{http://www.w3.org/2005/Atom}link')
                updated_elem = entry.find('{http://www.w3.org/2005/Atom}updated')
                published_elem = entry.find('{http://www.w3.org/2005/Atom}published')
                
                if title_elem is not None and link_elem is not None:
                    title = title_elem.text
                    link = link_elem.get('href')
                    
                    # Get publication date
                    date_str = (published_elem.text if published_elem is not None 
                               else updated_elem.text if updated_elem is not None else None)
                    
                    if date_str:
                        # Parse ISO 8601 date
                        try:
                            pub_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                            # Convert to naive datetime for comparison
                            pub_date = pub_date.replace(tzinfo=None)
                            
                            if pub_date > since_time:
                                articles.append({
                                    'title': title,
                                    'link': link,
                                    'pubDate': pub_date.isoformat()
                                })
                        except (ValueError, AttributeError):
                            # If date parsing fails, include the article anyway
                            articles.append({
                                'title': title,
                                'link': link,
                                'pubDate': date_str
                            })
        else:
            # RSS feed
            for item in root.findall('.//item'):
                title_elem = item.find('title')
                link_elem = item.find('link')
                pubdate_elem = item.find('pubDate')
                
                if title_elem is not None and link_elem is not None:
                    title = title_elem.text
                    link = link_elem.text
                    
                    if pubdate_elem is not None and pubdate_elem.text:
                        try:
                            pub_date = parsedate_to_datetime(pubdate_elem.text)
                            # Convert to naive datetime for comparison
                            pub_date = pub_date.replace(tzinfo=None)
                            
                            if pub_date > since_time:
                                articles.append({
                                    'title': title,
                                    'link': link,
                                    'pubDate': pub_date.isoformat()
                                })
                        except (ValueError, TypeError):
                            # If date parsing fails, include the article anyway
                            articles.append({
                                'title': title,
                                'link': link,
                                'pubDate': pubdate_elem.text
                            })
                    else:
                        # No date available, include anyway
                        articles.append({
                            'title': title,
                            'link': link,
                            'pubDate': 'Unknown'
                        })
    
    except (URLError, HTTPError, ET.ParseError, Exception) as e:
        # Return None to indicate this feed failed
        print(f"Error fetching feed {url}: {str(e)}", file=sys.stderr)
        return None
    
    return articles


def format_for_teams(results):
    """
    Format the RSS feed results as markdown tables for MS Teams
    
    Args:
        results: Dictionary with 'successful' and 'failed' keys
    
    Returns:
        Formatted markdown string
    """
    output = []
    
    # Add successful feeds
    for feed_name, articles in results['successful'].items():
        output.append(f"\n## {feed_name}\n")
        
        if articles:
            output.append("| Title | Published |\n")
            output.append("|-------|----------|\n")
            for article in articles:
                title = article['title'][:100] + "..." if len(article['title']) > 100 else article['title']
                # Make title a clickable link
                title_link = f"[{title}]({article['link']})"
                pub_date = article.get('pubDate', 'Unknown')
                # Format date if it's an ISO string
                if pub_date != 'Unknown':
                    try:
                        dt = datetime.fromisoformat(pub_date)
                        pub_date = dt.strftime('%Y-%m-%d %H:%M')
                    except:
                        pass
                output.append(f"| {title_link} | {pub_date} |\n")
        else:
            output.append("*No new articles*\n")
    
    # Add failed feeds if any
    if results['failed']:
        output.append("\n## RSS Feeds Not Retrieved\n")
        output.append("| Feed Name |\n")
        output.append("|-----------|\n")
        for feed_name in results['failed']:
            output.append(f"| {feed_name} |\n")
    
    return ''.join(output)


def main():
    parser = argparse.ArgumentParser(description='Fetch and format RSS feeds')
    parser.add_argument('--config', default='.github/rss-feeds.json',
                       help='Path to RSS feeds configuration file')
    parser.add_argument('--hours', type=int, default=24,
                       help='Fetch articles from the last N hours')
    parser.add_argument('--output', default='rss-output.json',
                       help='Output file for results')
    parser.add_argument('--markdown-output', default='rss-output.md',
                       help='Output file for markdown formatted results')
    
    args = parser.parse_args()
    
    # Calculate since_time
    since_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=args.hours)
    print(f"Fetching articles published after {since_time.isoformat()}", file=sys.stderr)
    
    # Load RSS feeds configuration
    try:
        with open(args.config, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file {args.config} not found", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {args.config}: {e}", file=sys.stderr)
        sys.exit(1)
    
    results = {
        'successful': {},
        'failed': []
    }
    
    # Fetch each feed
    for feed in config['feeds']:
        feed_name = feed['name']
        feed_url = feed['url']
        
        print(f"Fetching {feed_name}...", file=sys.stderr)
        articles = parse_rss_feed(feed_url, since_time)
        
        if articles is not None:
            results['successful'][feed_name] = articles
            print(f"  Found {len(articles)} new articles", file=sys.stderr)
        else:
            results['failed'].append(feed_name)
            print(f"  Failed to fetch", file=sys.stderr)
    
    # Save results as JSON
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Format and save as markdown
    markdown = format_for_teams(results)
    with open(args.markdown_output, 'w') as f:
        f.write(markdown)
    
    print(f"\nResults saved to {args.output} and {args.markdown_output}", file=sys.stderr)
    
    # Print summary
    total_articles = sum(len(articles) for articles in results['successful'].values())
    print(f"\nSummary:", file=sys.stderr)
    print(f"  Successful feeds: {len(results['successful'])}", file=sys.stderr)
    print(f"  Failed feeds: {len(results['failed'])}", file=sys.stderr)
    print(f"  Total new articles: {total_articles}", file=sys.stderr)


if __name__ == '__main__':
    main()
