#!/usr/bin/env bash
# refresh-memes.sh — Fetch current trending topics via Brave Search API
# Outputs structured trend data to ../data/trends.json
# Intended to be run by cron or manually to inform meme text updates.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data"
OUTPUT="$DATA_DIR/trends.json"
mkdir -p "$DATA_DIR"

# Load API key
if [ -f "$HOME/.openclaw/.env" ]; then
  BRAVE_API_KEY=$(grep '^BRAVE_API_KEY=' "$HOME/.openclaw/.env" | cut -d'=' -f2)
fi

if [ -z "${BRAVE_API_KEY:-}" ]; then
  echo "ERROR: BRAVE_API_KEY not found in ~/.openclaw/.env" >&2
  exit 1
fi

BRAVE_URL="https://api.search.brave.com/res/v1/web/search"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Search queries to capture different trend angles
QUERIES=(
  "TikTok viral trends this week"
  "trending memes right now"
  "gen z gen alpha slang trending"
  "pop culture news memes this week"
  "viral moments controversy this week"
)

echo "Fetching trends at $TIMESTAMP..."

# Build JSON output
RESULTS="[]"

for q in "${QUERIES[@]}"; do
  echo "  Searching: $q"
  RESPONSE=$(curl -s -H "Accept: application/json" \
    -H "Accept-Encoding: gzip" \
    -H "X-Subscription-Token: $BRAVE_API_KEY" \
    --compressed \
    "$BRAVE_URL?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$q'))")&count=5&freshness=pw" \
    2>/dev/null || echo '{"web":{"results":[]}}')

  # Extract titles and descriptions
  PARSED=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    results = data.get('web', {}).get('results', [])
    out = []
    for r in results[:5]:
        out.append({
            'title': r.get('title', ''),
            'description': r.get('description', '')[:200],
            'url': r.get('url', ''),
            'published': r.get('page_age', r.get('age', ''))
        })
    print(json.dumps(out))
except:
    print('[]')
" 2>/dev/null || echo '[]')

  # Merge into results
  RESULTS=$(python3 -c "
import json, sys
existing = json.loads('$RESULTS')
new_items = json.loads('''$PARSED''')
for item in new_items:
    item['query'] = '$q'
existing.extend(new_items)
print(json.dumps(existing))
" 2>/dev/null || echo "$RESULTS")

  # Rate limit: 1 req/sec for free plan
  sleep 1.5
done

# Write final output
python3 -c "
import json
results = json.loads('''$RESULTS''')
output = {
    'fetched_at': '$TIMESTAMP',
    'query_count': len(set(r.get('query','') for r in results)),
    'result_count': len(results),
    'trends': results
}
print(json.dumps(output, indent=2))
" > "$OUTPUT"

echo "Done. Wrote ${#RESULTS} chars to $OUTPUT"
echo "Results: $(python3 -c "import json; print(json.load(open('$OUTPUT'))['result_count'])" 2>/dev/null || echo 'unknown') items"
