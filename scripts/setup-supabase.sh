#!/usr/bin/env bash
# ==============================================================================
# PILOT AI — one-shot Supabase setup for a fresh project
#
# Usage:
#   ./scripts/setup-supabase.sh <project-ref> <anthropic-api-key> [allowed-origins]
#
#   project-ref        20-char id from your Supabase project URL
#   anthropic-api-key  sk-ant-...  (stored as an Edge Function secret, never in git)
#   allowed-origins    optional, comma separated, e.g. https://my-app.vercel.app
#
# What it does:
#   1. links this folder to your Supabase project
#   2. applies the migrations (schema, seed roles/models/plans, security)
#   3. stores the Anthropic key as a server-side secret
#   4. deploys the anthropic-proxy Edge Function
# ==============================================================================
set -euo pipefail

REF="${1:-}"
KEY="${2:-}"
ORIGINS="${3:-}"

if [[ -z "$REF" || -z "$KEY" ]]; then
  echo "usage: $0 <project-ref> <anthropic-api-key> [allowed-origins]" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "▶ 1/4 linking project $REF"
npx supabase link --project-ref "$REF"

echo "▶ 2/4 applying migrations"
npx supabase db push

echo "▶ 3/4 storing secrets"
npx supabase secrets set ANTHROPIC_API_KEY="$KEY"
if [[ -n "$ORIGINS" ]]; then
  npx supabase secrets set ALLOWED_ORIGINS="$ORIGINS"
fi

echo "▶ 4/4 deploying Edge Function"
npx supabase functions deploy anthropic-proxy

cat <<EOF

✔ Supabase is ready.

Next:
  1. cp .env.example .env.local
  2. paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
     (Dashboard → Project Settings → API)
  3. npm run dev  →  http://localhost:5173
EOF
