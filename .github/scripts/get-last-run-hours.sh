#!/bin/bash
# Script to determine the time range for RSS feed collection
# Returns the number of hours to fetch based on last successful workflow run

set -e

WORKFLOW_FILE="${1:-rss-feed-collector.yml}"
MANUAL_HOURS="${2:-}"

# Get the current date
TODAY=$(date -u +%Y-%m-%d)

# Try to get the last successful run time from this workflow
LAST_RUN=$(gh run list \
  --workflow="$WORKFLOW_FILE" \
  --status=success \
  --limit=1 \
  --json updatedAt \
  --jq '.[0].updatedAt' 2>/dev/null || echo "")

if [ -n "$LAST_RUN" ]; then
  LAST_RUN_DATE=$(date -u -d "$LAST_RUN" +%Y-%m-%d)
  LAST_RUN_EPOCH=$(date -u -d "$LAST_RUN" +%s)
  NOW_EPOCH=$(date -u +%s)
  HOURS_SINCE=$(((NOW_EPOCH - LAST_RUN_EPOCH) / 3600))
  
  # If last run was today, use 24 hours, otherwise use hours since last run
  if [ "$LAST_RUN_DATE" = "$TODAY" ]; then
    HOURS=24
    echo "Last successful run was today, fetching articles from last 24 hours" >&2
  else
    # Cap at 168 hours (1 week) to avoid too much data
    if [ $HOURS_SINCE -gt 168 ]; then
      HOURS=168
    else
      HOURS=$HOURS_SINCE
    fi
    echo "Last successful run was $HOURS hours ago, fetching articles since then" >&2
  fi
else
  # No previous successful run, default to 24 hours
  HOURS=24
  echo "No previous successful run found, fetching articles from last 24 hours" >&2
fi

# Use manual input if provided, otherwise use calculated hours
if [ -n "$MANUAL_HOURS" ]; then
  HOURS="$MANUAL_HOURS"
  echo "Using manual input: $HOURS hours" >&2
fi

echo "$HOURS"
