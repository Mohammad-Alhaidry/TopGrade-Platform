// إدارة سمارت برو: opens quickly from the Home Screen (its own files, refreshed from the server whenever online)
// and receives the owner's test notifications. Its data always comes live from the server.

const CACHE = 'smartpro-admin-v1';
const SHELL = ['./', 'admin.js', 'admin.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map((f) => new URL(f, self.registration.scope).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('smartpro-admin-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// The app's own files: the server's copy first (so an update shows at once), the saved copy when offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope) || url.pathname.includes('/api/')) return;
  const key = event.request.mode === 'navigate' ? SHELL[0] : url.href.split('?')[0];
  if (!SHELL.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(event.request, { cache: 'no-cache' });
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch {
      return (await cache.match(key)) ?? Response.error();
    }
  })());
});

// A test notification sent from this app (same message shape as the students get).
self.addEventListener('push', (event) => {
  let msg = {};
  try { msg = event.data?.json() ?? {}; } catch { msg = { body: event.data?.text() }; }
  const n = msg.notification || msg;
  event.waitUntil(self.registration.showNotification(n.title || 'سمارت برو', {
    body: n.body || '',
    // No large picture: Android already shows the app's own icon beside the text (it would appear twice).
    badge: new URL('../assets/icons/badge-96.png', self.registration.scope).href,
    tag: n.tag || 'smartpro-test',
    dir: 'auto',
    lang: 'ar',
    data: { url: n.navigate || msg.url },
  }));
});

// Tapping a test notification opens the page the students would see.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (url) event.waitUntil(self.clients.openWindow(url));
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const old = event.oldSubscription;
    const key = old?.options?.applicationServerKey;
    const sub = event.newSubscription || (key && await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
    if (!sub) return;
    await fetch(new URL('../api/push/renew', self.registration.scope).href, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldEndpoint: old?.endpoint, subscription: sub.toJSON() }),
    });
  })());
});
