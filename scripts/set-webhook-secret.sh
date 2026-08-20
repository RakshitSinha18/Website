#!/usr/bin/env bash
# Sets ONLY the Razorpay webhook secret as a Supabase Edge Function secret,
# without the value appearing on a command line or on screen.
#
# Usage:  bash scripts/set-webhook-secret.sh
set -euo pipefail
REF="ipuwwhksolvkswsnseis"
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(grep '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv 2>/dev/null | tail -1 | cut -d= -f2-)}"

printf 'Paste the Razorpay WEBHOOK secret (the string you entered in the webhook form), then Enter:\n> '
IFS= read -rs WH; printf '\n'
[ -z "${WH:-}" ] && { echo "❌ No secret entered."; exit 1; }

if supabase secrets set "RAZORPAY_WEBHOOK_SECRET=$WH" --project-ref "$REF" >/dev/null 2>&1; then
  echo "✅ RAZORPAY_WEBHOOK_SECRET set. Webhook events will now be verified."
else
  echo "❌ Failed to set the secret — check the token."
  exit 1
fi
