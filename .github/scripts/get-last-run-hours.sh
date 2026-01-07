#!/bin/bash
# Script to determine the time range for RSS feed collection
# Always returns 720 hours (30 days) to support all timeframe filter options

set -e

WORKFLOW_FILE="${1:-rss-feed-collector.yml}"
MANUAL_HOURS="${2:-}"

# Default to 720 hours (30 days) to support all timeframe filters (1 day, 7 days, 30 days)
HOURS=720

# Use manual input if provided, otherwise use 720 hours
if [ -n "$MANUAL_HOURS" ]; then
  HOURS="$MANUAL_HOURS"
  echo "Using manual input: $HOURS hours" >&2
else
  echo "Fetching articles from last $HOURS hours (30 days) to support all timeframe filters" >&2
fi

echo "$HOURS"
