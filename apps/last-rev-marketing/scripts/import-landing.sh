#!/usr/bin/env bash
# import-landing.sh — Convert an app's landing.html into a Last Rev marketing site page
#
# Usage:
#   ./scripts/import-landing.sh <app-name>              # single app
#   ./scripts/import-landing.sh --all                    # all apps with landing.html
#   ./scripts/import-landing.sh --list                   # list available apps
#
# What it does:
#   1. Reads apps/<app-name>/landing.html
#   2. Extracts the content sections (between nav and footer)
#   3. Wraps in the marketing site template (lr-nav, lr-footer, correct CSS/JS)
#   4. Writes to apps/last-rev-marketing/app-<app-name>.html
#
# The output page uses the marketing site's theme and navigation while
# preserving the original content and shared component markup.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MARKETING_DIR="$(dirname "$SCRIPT_DIR")"
APPS_DIR="$(dirname "$MARKETING_DIR")"

# ── helpers ──────────────────────────────────────────────────────────

list_available() {
  echo "Apps with landing.html:"
  for f in "$APPS_DIR"/*/landing.html; do
    [ -f "$f" ] || continue
    app="$(basename "$(dirname "$f")")"
    # skip the marketing site itself
    [[ "$app" == "last-rev-marketing" ]] && continue
    status=""
    [ -f "$MARKETING_DIR/app-${app}.html" ] && status=" [already imported]"
    echo "  $app$status"
  done
}

extract_title() {
  # Pull the <title> text from the landing page
  grep -oP '(?<=<title>).*?(?=</title>)' "$1" 2>/dev/null | head -1
}

extract_description() {
  # Get the meta description specifically (not viewport or other meta tags)
  grep -i 'name="description"' "$1" 2>/dev/null | grep -oP 'content="\K[^"]*' | head -1
}

extract_content() {
  local file="$1"
  # Extract everything between the nav line and the footer line
  # Strategy: skip everything up to and including the nav element,
  # then capture until we hit a <footer or <lr-footer or </body
  python3 -c "
import re, sys

html = open('$file').read()

# Remove everything before the content: strip head, opening body, bg-fixed, nav elements
# Find the end of the last nav-like element
nav_patterns = [
    r'<cc-app-nav[^>]*>.*?</cc-app-nav>',
    r'<cc-app-nav[^>]*/?>',
    r'<lr-nav[^>]*/?>',
    r'<cc-nav[^>]*>.*?</cc-nav>',
    r'<nav[^>]*>.*?</nav>',
]

# Find the last nav element's end position
content_start = 0
for pat in nav_patterns:
    for m in re.finditer(pat, html, re.DOTALL):
        if m.end() > content_start:
            content_start = m.end()

# If no nav found, start after <body...>
if content_start == 0:
    m = re.search(r'<body[^>]*>', html)
    if m:
        content_start = m.end()

# Also skip past lp-bg-fixed and cc-auth if they appear before first section
remaining = html[content_start:]
remaining = re.sub(r'^\s*<div class=\"lp-bg-fixed\"></div>\s*', '', remaining)
remaining = re.sub(r'^\s*<cc-auth></cc-auth>\s*', '', remaining)

# Find the footer/end
footer_patterns = [
    r'<footer[^>]*>',
    r'<lr-footer[^>]*>',
    r'</body>',
]
content_end = len(remaining)
for pat in footer_patterns:
    m = re.search(pat, remaining)
    if m and m.start() < content_end:
        content_end = m.start()

content = remaining[:content_end].strip()

# Fix shared component URLs: convert CDN URLs to local paths
content = content.replace('https://shared.adam-harris.alphaclaw.app/', './shared/')

print(content)
"
}

generate_page() {
  local app="$1"
  local source="$APPS_DIR/$app/landing.html"
  local output="$MARKETING_DIR/app-${app}.html"

  if [ ! -f "$source" ]; then
    echo "ERROR: $source not found" >&2
    return 1
  fi

  local title
  title="$(extract_title "$source")"
  [ -z "$title" ] && title="$app"

  local description
  description="$(extract_description "$source")"
  [ -z "$description" ] && description="$title — Built with AlphaClaw by Last Rev"

  local content
  content="$(extract_content "$source")"

  # Build the page
  cat > "$output" <<PAGEEOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Last Rev</title>
  <meta name="description" content="${description}">

  <!-- Styles -->
  <link rel="stylesheet" href="./shared/theme.css">
  <link rel="stylesheet" href="./shared/landing.css">
  <link rel="stylesheet" href="./css/last-rev.css">

  <!-- Components -->
  <script src="./shared/components/index.js"></script>
  <script src="./js/lr-nav.js" defer></script>
  <script src="./js/lr-subnav.js" defer></script>
  <script src="./js/lr-footer.js" defer></script>
  <script src="./js/app.js" defer></script>

  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
</head>
<body class="lp">

  <!-- Fixed background -->
  <div class="lp-bg-fixed"></div>

  <!-- Navigation -->
  <lr-nav active="apps" cta-text="Get in Touch" cta-href="./index.html#contact"></lr-nav>

  <!-- Imported content from ${app}/landing.html -->
  ${content}

  <!-- Footer -->
  <lr-footer></lr-footer>

</body>
</html>
PAGEEOF

  echo "✅ Created: app-${app}.html (from $app/landing.html)"
}

# ── main ─────────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  echo "Usage: $0 <app-name> | --all | --list"
  exit 1
fi

case "$1" in
  --list)
    list_available
    ;;
  --all)
    count=0
    for f in "$APPS_DIR"/*/landing.html; do
      [ -f "$f" ] || continue
      app="$(basename "$(dirname "$f")")"
      [[ "$app" == "last-rev-marketing" ]] && continue
      generate_page "$app" && ((count++)) || true
    done
    echo ""
    echo "Done — imported $count pages."
    ;;
  *)
    generate_page "$1"
    ;;
esac
