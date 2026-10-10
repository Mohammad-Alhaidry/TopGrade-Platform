# Smart Pro notifications service

Students follow a course with the bell on its page (or the invitation after a quiz). The owner sends from
`/admin/` (live) or `/preview/admin/` (preview), which ask for the admin password.

- `server.mjs`: the HTTP service on 127.0.0.1:3120. Public: `/api/push/key|subscribe|unsubscribe|renew|click`.
  Admin: `/admin/` page and `/admin/api/stats|history|send`. nginx sets `X-Site: live|preview`.
- Storage: `/var/lib/smartpro-push/push.json` (push addresses, followed courses, language; send history).
- VAPID keys: `/etc/smartpro-push/vapid.json` (created once by `install.sh`, never in git).
- `install.sh`: copies this folder to `/opt/smartpro-push`, installs dependencies, (re)starts the systemd unit
  `smartpro-push`. `tg-app-deploy` runs it on every live publish.
- nginx: see `nginx-locations.conf`.
- App side: `public/assets/js/app/notify.js` (permission, subscription), `push-ui.js` (bell, invitation),
  and the `push` / `notificationclick` / `pushsubscriptionchange` handlers in `public/sw.js`.
