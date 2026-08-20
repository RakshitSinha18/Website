#!/usr/bin/env bash
# Sets the notify Edge Function's email secrets (Resend) without the API key
# appearing on a command line or on screen. Paste the key at the hidden prompt.
#
# Usage:  bash scripts/set-notify-secrets.sh
set -euo pipefail
REF="ipuwwhksolvkswsnseis"
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(grep '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv 2>/dev/null | tail -1 | cut -d= -f2-)}"

printf 'Paste your Resend API key (re_...) for booking notifications, then Enter:\n> '
IFS= read -rs REKEY; printf '\n'
[ -z "${REKEY:-}" ] && { echo "❌ No key entered."; exit 1; }

# OWNER_EMAIL: where booking alerts go. FROM_EMAIL: verified sender.
if supabase secrets set \
  "RESEND_API_KEY=$REKEY" \
  "OWNER_EMAIL=rsinha1369@gmail.com" \
  "FROM_EMAIL=Rakshit Sinha <no-reply@sinharakshit.com>" \
  --project-ref "$REF" >/dev/null 2>&1; then
  echo "✅ notify secrets set. New booking requests will email the admin."
  echo "   OWNER_EMAIL=rsinha1369@gmail.com · FROM=no-reply@sinharakshit.com"
else
  echo "❌ Failed to set secrets — check the token."
  exit 1
fi
