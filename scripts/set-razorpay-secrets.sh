#!/usr/bin/env bash
# Sets the Razorpay keys as Supabase Edge Function secrets without the values
# ever appearing on a command line or on screen. Paste at the hidden prompts.
#
# Usage:  bash scripts/set-razorpay-secrets.sh
set -euo pipefail

REF="ipuwwhksolvkswsnseis"
# Ensure the CLI token is available.
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(grep '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv 2>/dev/null | tail -1 | cut -d= -f2-)}"

printf 'Razorpay KEY ID (starts rzp_live_ or rzp_test_), then Enter:\n> '
IFS= read -rs RZP_ID; printf '\n'
printf 'Razorpay KEY SECRET, then Enter:\n> '
IFS= read -rs RZP_SECRET; printf '\n'
printf 'Razorpay WEBHOOK SECRET (from the webhook you create; can leave blank for now), then Enter:\n> '
IFS= read -rs RZP_WH; printf '\n'

if [ -z "${RZP_ID:-}" ] || [ -z "${RZP_SECRET:-}" ]; then
  echo "❌ Key ID and Key Secret are both required."
  exit 1
fi

# Build the secrets set command. SITE_URL/NOTIFY_URL are safe, non-secret.
ARGS=(
  "RAZORPAY_KEY_ID=$RZP_ID"
  "RAZORPAY_KEY_SECRET=$RZP_SECRET"
  "SITE_URL=https://sinharakshit.com"
  "NOTIFY_URL=https://$REF.functions.supabase.co/notify"
)
[ -n "${RZP_WH:-}" ] && ARGS+=("RAZORPAY_WEBHOOK_SECRET=$RZP_WH")

if supabase secrets set "${ARGS[@]}" --project-ref "$REF" >/dev/null 2>&1; then
  echo "✅ Razorpay secrets set on the Edge Functions."
  echo "   (KEY_ID, KEY_SECRET, SITE_URL, NOTIFY_URL${RZP_WH:+, WEBHOOK_SECRET})"
else
  echo "❌ Failed to set secrets — check the token/keys."
  exit 1
fi
