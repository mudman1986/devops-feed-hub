#!/usr/bin/env bash
# Generate test HTML files for UI tests using existing test fixture data
# This creates HTML files needed by Playwright tests

set -euo pipefail

OUTPUT_DIR="${1:-docs}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DATA="${SCRIPT_DIR}/../workflows/test-fixtures/rss-test-data.json"

echo "Generating test HTML files for UI tests..." >&2

# Check if test data exists
if [ ! -f "$TEST_DATA" ]; then
echo "Error: Test data not found at $TEST_DATA" >&2
exit 1
fi

# Generate HTML files using existing test fixture
python3 .github/actions/collect-rss-feeds/generate_summary.py \
--input "$TEST_DATA" \
--output-dir "$OUTPUT_DIR"

echo "✓ Test HTML files generated in $OUTPUT_DIR/" >&2
echo "✓ Files created: index.html, summary.html, feed-*.html" >&2
echo "✓ Using test data from: $TEST_DATA" >&2
