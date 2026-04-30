#!/usr/bin/env bash
set -euo pipefail

# dev-local.sh — start the full local stack:
#   - Local Supabase (Postgres + Studio) via Docker
#   - Apply migrations + seed.sql via psql (bypassing supabase's migration
#     applier, which doesn't tolerate the repo's paired .down.sql files or
#     the duplicate numeric prefixes in supabase/migrations/)
#   - Run `next dev` with local Supabase env injected
#
# Auth0 dev tenant and Stripe test-mode keys come from .env.local as-is.
# Stripe webhooks: in a separate terminal, run
#   stripe listen --forward-to localhost:3000/api/stripe/webhook

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ supabase CLI not found. Install: brew install supabase/tap/supabase" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "✗ psql not found. Install: brew install libpq && brew link --force libpq" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker is not running. Start Docker Desktop and retry." >&2
  exit 1
fi

RESET_DB=0
SKIP_APPLY=0
for arg in "$@"; do
  case "$arg" in
    --reset) RESET_DB=1 ;;
    --no-apply) SKIP_APPLY=1 ;;
    -h|--help)
      cat <<EOF
Usage: pnpm dev:local [--reset|--no-apply]

  --reset      Stop Supabase, drop the volume, and re-apply every migration
               from scratch (plus seed.sql). Destroys local data.
  --no-apply   Skip the migration apply step (advanced — assumes schema is
               already current).

By default this starts Supabase if needed, applies any *new* migrations
incrementally (idempotent), seeds, and launches \`next dev\` with local
Supabase URL/keys exported into the environment.
EOF
      exit 0
      ;;
  esac
done

if [[ "$RESET_DB" -eq 1 ]]; then
  echo "→ Resetting: stopping Supabase and dropping the local DB volume…"
  supabase stop --no-backup >/dev/null 2>&1 || true
fi

if supabase status >/dev/null 2>&1; then
  echo "→ Supabase is already running."
else
  echo "→ Starting local Supabase…"
  supabase start
fi

# Pull connection info into shell vars (API_URL, ANON_KEY, SERVICE_ROLE_KEY,
# DB_URL, STUDIO_URL, …)
eval "$(supabase status -o env)"

apply_migrations() {
  # Track which migration files have been applied via a tiny marker table
  # in the local DB. Idempotent — re-running skips files already in the
  # marker table. The supabase_migrations.schema_migrations table is left
  # alone (it expects unique numeric prefixes, which this repo violates).
  psql "$DB_URL" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
create schema if not exists local_dev;
create table if not exists local_dev.applied_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
SQL

  shopt -s nullglob
  local applied=0 skipped=0
  for f in supabase/migrations/*.sql; do
    case "$f" in
      *.down.sql) continue ;;
    esac
    local name
    name="$(basename "$f")"

    local already
    already="$(psql "$DB_URL" -t -A -c \
      "select 1 from local_dev.applied_migrations where filename = '$name'" 2>/dev/null || true)"
    if [[ "$already" == "1" ]]; then
      skipped=$((skipped + 1))
      continue
    fi

    echo "  applying $name"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f" >/dev/null
    psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
      "insert into local_dev.applied_migrations(filename) values ('$name')" >/dev/null
    applied=$((applied + 1))
  done
  shopt -u nullglob
  echo "  migrations: $applied applied, $skipped already up-to-date"
}

apply_seed() {
  if [[ -f supabase/seed.sql ]]; then
    echo "→ Applying seed.sql"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql >/dev/null
  fi
}

if [[ "$SKIP_APPLY" -eq 0 ]]; then
  echo "→ Applying migrations via psql (idempotent)…"
  apply_migrations
  apply_seed
fi

export DEPLOYMENT_ENV=local
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
export SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY"
export SUPABASE_PROJECT_ID="local"
export SUPABASE_DB_URL="$DB_URL"

cat <<EOF

──────────────────────────────────────────────────────────────
  Local stack ready
    Supabase API     $API_URL
    Supabase Studio  ${STUDIO_URL:-http://127.0.0.1:54323}
    Postgres         $DB_URL
    Auth0            (dev tenant from .env.local)
    Stripe           (test mode from .env.local)

  Stripe webhooks (separate terminal):
    stripe listen --forward-to localhost:3000/api/stripe/webhook

  Stop the DB later with:  pnpm db:local:stop
  Full reset with:         pnpm dev:local --reset
──────────────────────────────────────────────────────────────

EOF

exec pnpm dev
