# Smart Pro notifications service

Students follow a course with the bell on its page (or the invitation after a quiz). The owner uses the
«إدارة سمارت برو» app at `/admin/` (live) or `/preview/admin/` (preview): installable (own manifest, icons and
service worker), its own sign-in (password hash in `/etc/smartpro-push/admin.json`, 180-day session cookie),
subscriber numbers, a composer (audience, message with length guidance and templates, destination, send now or
schedule, iPhone/Android preview, review), test devices (the admin app subscribes itself), history with
delivered/tapped counts, cancel of scheduled sends, password change.

- `server.mjs`: the HTTP service on 127.0.0.1:3120. Public: `/api/push/key|subscribe|unsubscribe|renew|click`.
  Admin: `/admin/` app files and `/admin/api/login|logout|password|overview|history|send|cancel|test-devices`.
  nginx sets `X-Site: live|preview` and `X-Real-IP`.
- Storage: `/var/lib/smartpro-push/push.json` (push addresses, followed courses, language; send history).
- VAPID keys: `/etc/smartpro-push/vapid.json` (created once by `install.sh`, never in git).
- `install.sh`: copies this folder to `/opt/smartpro-push`, installs dependencies, (re)starts the systemd unit
  `smartpro-push`. `tg-app-deploy` runs it on every live publish.
- nginx: see `nginx-locations.conf`.
- App side: `public/assets/js/app/notify.js` (permission, subscription), `push-ui.js` (bell, invitation),
  and the `push` / `notificationclick` / `pushsubscriptionchange` handlers in `public/sw.js`.
