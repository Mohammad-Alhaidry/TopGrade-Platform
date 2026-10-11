#!/usr/bin/env bash
# Installs or updates the push service from this folder: /opt/smartpro-push, systemd unit, restart.
# Run by tg-app-deploy; safe to run again. VAPID keys stay in /etc/smartpro-push (created once, never in git).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p /opt/smartpro-push /var/lib/smartpro-push
rsync -a --delete --exclude node_modules --exclude install.sh "$HERE/" /opt/smartpro-push/
(cd /opt/smartpro-push && npm ci --omit=dev --no-audit --no-fund --silent)
if [ ! -f /etc/smartpro-push/vapid.json ]; then
  mkdir -p /etc/smartpro-push && chmod 700 /etc/smartpro-push
  (cd /opt/smartpro-push && node -e "const k=require('web-push').generateVAPIDKeys();require('fs').writeFileSync('/etc/smartpro-push/vapid.json',JSON.stringify({...k,subject:'https://smartpro-edu.com'},null,2),{mode:0o600})")
fi
install -m 644 /opt/smartpro-push/smartpro-push.service /etc/systemd/system/smartpro-push.service
systemctl daemon-reload
systemctl enable --quiet smartpro-push
systemctl restart smartpro-push
for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -fsS -H 'X-Site: live' http://127.0.0.1:3120/api/push/key >/dev/null 2>&1 && { echo "smartpro-push running"; exit 0; }
  sleep 0.5
done
echo "smartpro-push did not start" >&2; journalctl -u smartpro-push -n 20 --no-pager >&2; exit 1
