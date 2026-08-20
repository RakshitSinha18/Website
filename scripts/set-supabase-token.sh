#!/usr/bin/env bash
# Sets SUPABASE_ACCESS_TOKEN for the CLI without the token ever appearing on a
# command line or on screen. Paste the token at the hidden prompt.
#
# Usage:  bash scripts/set-supabase-token.sh
set -euo pipefail

printf 'Paste your Supabase access token (input hidden), then press Enter:\n> '
# -s hides input; works in bash. Read a single line into TOKEN.
IFS= read -rs TOKEN
printf '\n'

if [ -z "${TOKEN:-}" ]; then
  echo "❌ No token entered."
  exit 1
fi

# Persist for future shells, and verify right now.
if grep -q '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv 2>/dev/null; then
  # Replace any existing line.
  tmp="$(mktemp)"
  grep -v '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv > "$tmp" || true
  mv "$tmp" ~/.zshenv
fi
printf 'export SUPABASE_ACCESS_TOKEN=%s\n' "$TOKEN" >> ~/.zshenv

if SUPABASE_ACCESS_TOKEN="$TOKEN" supabase projects list >/dev/null 2>&1; then
  echo "✅ Token accepted and saved to ~/.zshenv"
else
  echo "❌ Token was rejected by Supabase — check it wasn't revoked/mistyped."
  exit 1
fi
