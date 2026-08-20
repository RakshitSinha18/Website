#!/usr/bin/env bash
# Configures Supabase Auth to send emails via Resend SMTP, WITHOUT the API key
# appearing on a command line or on screen. Paste the key at the hidden prompt.
#
# Usage:  bash scripts/set-resend-smtp.sh
set -euo pipefail
REF="ipuwwhksolvkswsnseis"
export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$(grep '^export SUPABASE_ACCESS_TOKEN=' ~/.zshenv 2>/dev/null | tail -1 | cut -d= -f2-)}"

printf 'Paste your Resend API key (re_...), then Enter:\n> '
IFS= read -rs REKEY; printf '\n'
[ -z "${REKEY:-}" ] && { echo "❌ No key entered."; exit 1; }

# Configure custom SMTP (Resend) via the Management API and re-enable email confirmation.
RESP=$(curl -s -X PATCH "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"smtp_host\": \"smtp.resend.com\",
    \"smtp_port\": \"465\",
    \"smtp_user\": \"resend\",
    \"smtp_pass\": \"$REKEY\",
    \"smtp_admin_email\": \"no-reply@sinharakshit.com\",
    \"smtp_sender_name\": \"Rakshit Sinha\",
    \"mailer_autoconfirm\": false
  }")

# Check it applied.
echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('smtp_host')=='smtp.resend.com':
    print('✅ Resend SMTP configured. Email verification re-enabled (mailer_autoconfirm='+str(d.get('mailer_autoconfirm'))+').')
    print('   Sender: no-reply@sinharakshit.com | Host: smtp.resend.com:465')
else:
    print('❌ SMTP not applied. Response:'); print(json.dumps(d, indent=2)[:600])
"
