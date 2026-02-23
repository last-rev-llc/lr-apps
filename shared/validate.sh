#!/bin/bash
# Validate an app directory against web development conventions
# Usage: ./validate.sh <app-directory>
# Reference: memory/domains/web-development.md

set -euo pipefail

DIR="${1:?Usage: validate.sh <app-directory>}"
[ -d "$DIR" ] || { echo "❌ Directory not found: $DIR"; exit 1; }

ERRORS=0
WARNS=0

fail() { echo "❌ FAIL: $1"; ((ERRORS++)); }
warn() { echo "⚠️  WARN: $1"; ((WARNS++)); }
pass() { echo "✅ PASS: $1"; }

echo "━━━ Validating: $DIR ━━━"
echo

# Check all HTML files
for f in "$DIR"/*.html; do
  [ -f "$f" ] || continue
  base=$(basename "$f")

  # data-theme="dark" on <html>
  if grep -q '<html' "$f"; then
    if grep -q 'data-theme="dark"' "$f"; then
      : # pass silently
    else
      fail "$base: missing data-theme=\"dark\" on <html>"
    fi
  fi

  # Supabase meta tags without <cc-auth>
  if grep -q 'supabase-url\|supabase-key' "$f"; then
    if grep -q '<cc-auth' "$f"; then
      : # pass
    else
      fail "$base: has Supabase meta tags but no <cc-auth>"
    fi
  fi

  # type="module" on components/index.js
  if grep -qE 'components/index\.js.*type="module"|type="module".*components/index\.js' "$f"; then
    fail "$base: type=\"module\" on components/index.js (it's an IIFE)"
  fi

  # Legacy nav components
  if grep -q '<cc-topbar\|<cc-nav[> ]' "$f"; then
    # Exclude cc-app-nav matches
    if grep -qE '<cc-topbar|<cc-nav[> /]' "$f" | grep -v 'cc-app-nav' 2>/dev/null; then
      fail "$base: uses legacy <cc-topbar> or <cc-nav> — use <cc-app-nav>"
    fi
  fi

  # @latest CDN URLs
  if grep -qE '@latest[/"'"'"']' "$f"; then
    fail "$base: unpinned CDN dependency (@latest)"
  fi

  # Inline onclick with interpolation (heuristic)
  if grep -qE "onclick=\"[^\"]*\\\$\{" "$f"; then
    warn "$base: possible inline onclick with string interpolation"
  fi

done

# Check JS files for common issues
for f in "$DIR"/*.js "$DIR"/js/*.js; do
  [ -f "$f" ] || continue
  base=$(basename "$f")

  # innerHTML without _esc (heuristic — warn only)
  if grep -q 'innerHTML' "$f"; then
    if ! grep -q '_esc\|esc(' "$f"; then
      warn "$base: uses innerHTML but no _esc() helper found"
    fi
  fi
done

echo
echo "━━━ Results: $ERRORS errors, $WARNS warnings ━━━"
[ "$ERRORS" -eq 0 ] && echo "✅ All checks passed" || echo "❌ Fix errors above"
exit "$ERRORS"
