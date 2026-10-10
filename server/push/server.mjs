// Smart Pro notifications service.
//
// Students: their app follows courses through /api/push/ (no personal data: the browser's push address, the
// followed courses and the interface language).
// Owner: the «إدارة سمارت برو» app at /admin/ (installable; sign-in with a password, then a long-lived session
// cookie). It shows subscriber numbers, composes and schedules notifications, sends tests to the owner's own
// test devices and keeps the history with delivered and tapped counts.
//
// nginx tells us which site a request is for with X-Site: "live" (/...) or "preview" (/preview/...): each site
// has its own subscribers, test devices and history. The client address comes in X-Real-IP.
//
// Files: PUSH_DB (default /var/lib/smartpro-push/push.json) for data, PUSH_VAPID (default
// /etc/smartpro-push/vapid.json) for the push keys, PUSH_ADMIN (default /etc/smartpro-push/admin.json) for the
// admin password hash.

import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import webpush from 'web-push';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3120);
const DB_PATH = process.env.PUSH_DB || '/var/lib/smartpro-push/push.json';
const VAPID_PATH = process.env.PUSH_VAPID || '/etc/smartpro-push/vapid.json';
const ADMIN_PATH = process.env.PUSH_ADMIN || '/etc/smartpro-push/admin.json';
const SITES = { live: { base: 'https://smartpro-edu.com/', admin: '/admin/' }, preview: { base: 'https://smartpro-edu.com/preview/', admin: '/preview/admin/' } };
const SESSION_DAYS = 180;
const DAY = 24 * 3600 * 1000;

// Push services we may post to. A subscription pointing anywhere else is refused, so nobody can make this server
// send requests to an arbitrary address.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/,
  /\.notify\.windows\.com$/, /^android\.googleapis\.com$/];

const vapid = JSON.parse(readFileSync(VAPID_PATH, 'utf8'));
webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

/* ---------- storage: one small JSON file, rewritten atomically after each change ---------- */

mkdirSync(dirname(DB_PATH), { recursive: true });
const store = existsSync(DB_PATH) ? JSON.parse(readFileSync(DB_PATH, 'utf8')) : {};
store.subs ??= {};      // endpoint -> { endpoint, site, p256dh, auth, courses[], lang, created, updated }
store.tests ??= {};     // endpoint -> { endpoint, site, p256dh, auth, label, created }  (the owner's test devices)
store.sends ??= [];     // { id, site, status, created, sendAt, sentAt, title, body, url, course, test, total, delivered, failed, removed, clicks }
store.sessions ??= {};  // sha256(token) -> { site, created, expires }
store.left ??= [];      // { site, at } a student stopped notifications (for the weekly numbers)
store.nextId ??= 1;
for (const s of store.sends) s.status ??= 'sent';

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    writeFileSync(`${DB_PATH}.tmp`, JSON.stringify(store));
    renameSync(`${DB_PATH}.tmp`, DB_PATH);
  }, 150);
}
const subsOf = (site) => Object.values(store.subs).filter((r) => r.site === site);
const testsOf = (site) => Object.values(store.tests).filter((r) => r.site === site);

/* ---------- admin password and sessions ---------- */

const hashPassword = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
function checkPassword(password) {
  if (!existsSync(ADMIN_PATH) || typeof password !== 'string' || password.length > 200) return false;
  const [salt, hash] = JSON.parse(readFileSync(ADMIN_PATH, 'utf8')).password.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
const tokenKey = (token) => createHash('sha256').update(String(token)).digest('hex');

function cookieOf(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
function signedIn(req, site) {
  const token = cookieOf(req, 'sp_admin');
  const s = token && store.sessions[tokenKey(token)];
  return Boolean(s && s.site === site && s.expires > Date.now());
}
const sessionCookie = (site, token, maxAge) =>
  `sp_admin=${token}; Path=${SITES[site].admin}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;

// Sign-in attempts: at most 8 failures per address in 15 minutes.
const failures = new Map();
function recentFailures(ip) {
  const now = Date.now();
  const list = (failures.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  failures.set(ip, list);
  return list;
}

/* ---------- helpers ---------- */

const send = (res, status, body, headers = {}) => {
  const json = body !== null && typeof body !== 'string';
  res.writeHead(status, { 'Content-Type': json ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(json ? JSON.stringify(body) : body ?? '');
};
const httpError = (status, message) => Object.assign(new Error(message), { status });

function readJson(req, limit = 8192) {
  if ((req.headers['content-type'] || '').split(';')[0] !== 'application/json') return Promise.reject(httpError(415, 'json only'));
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(httpError(413, 'too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(httpError(400, 'bad json')); }
    });
    req.on('error', reject);
  });
}

const isId = (s) => typeof s === 'string' && /^[a-z0-9-]{1,60}$/.test(s);
const cleanCourses = (list) => (Array.isArray(list) ? [...new Set(list.filter(isId))].slice(0, 50) : []);

function validSubscription(s) {
  if (!s || typeof s.endpoint !== 'string' || s.endpoint.length > 1000) return false;
  let url;
  try { url = new URL(s.endpoint); } catch { return false; }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((re) => re.test(url.hostname))) return false;
  const k = s.keys || {};
  return typeof k.p256dh === 'string' && typeof k.auth === 'string' && k.p256dh.length < 200 && k.auth.length < 100;
}

/** A link inside the site, e.g. "courses/business-math" -> https://smartpro-edu.com/courses/business-math */
function siteUrl(site, path) {
  const base = SITES[site].base;
  const url = new URL(String(path || '').replace(/^\/+/, ''), base);
  return url.href.startsWith(base) ? url.href : base;
}

/* ---------- sending ---------- */

async function deliver(record) {
  const { site, course, test } = record;
  let rows = test ? testsOf(site) : subsOf(site);
  if (!test && course) rows = rows.filter((r) => r.courses.includes(course));
  Object.assign(record, { status: 'sending', total: rows.length });
  save();

  // Declarative Web Push (Safari 18.4+ on iPhone/iPad Home Screen apps and Mac) shows the notification from
  // "notification" by itself, even if the service worker fails; other browsers ignore those fields and the
  // service worker shows it from the same message. The link carries ?n=<id> so the app counts the tap.
  const tag = course ? `course-${course}` : 'smartpro';
  const open = new URL(record.url);
  open.searchParams.set('n', String(record.id));
  const payload = JSON.stringify({
    web_push: 8030,
    notification: { title: record.title, body: record.body, navigate: open.href, lang: 'ar', dir: 'auto', tag },
    id: record.id, title: record.title, body: record.body, url: open.href, tag,
  });

  let delivered = 0, failed = 0, removed = 0;
  const queue = [...rows];
  const worker = async () => {
    for (let r = queue.shift(); r; r = queue.shift()) {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload, { TTL: 3 * 24 * 3600, urgency: 'normal' });
        delivered++;
      } catch (err) {
        failed++;
        // Gone or invalid: the app was removed, its data cleared, or notifications turned off.
        if ([404, 410].includes(err.statusCode)) {
          if (test) delete store.tests[r.endpoint];
          else { delete store.subs[r.endpoint]; store.left.push({ site, at: Date.now() }); }
          removed++;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(20, queue.length) }, worker));
  Object.assign(record, { status: 'sent', sentAt: Date.now(), delivered, failed, removed });
  save();
  return record;
}

// Scheduled notifications go out within half a minute of their time (also after a restart).
setInterval(() => {
  const now = Date.now();
  for (const r of store.sends) if (r.status === 'scheduled' && r.sendAt <= now) deliver(r).catch((err) => console.error(err));
}, 20 * 1000);

/* ---------- admin app files ---------- */

const ADMIN_FILES = {
  '': 'index.html', 'index.html': 'index.html', 'admin.js': 'admin.js', 'admin.css': 'admin.css',
  'manifest.webmanifest': 'manifest.webmanifest', 'sw.js': 'sw.js',
  'icon-192.png': 'icon-192.png', 'icon-512.png': 'icon-512.png', 'apple-touch-icon.png': 'apple-touch-icon.png',
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

/* ---------- routes ---------- */

async function route(req, res) {
  const site = req.headers['x-site'];
  if (!SITES[site]) return send(res, 400, { error: 'unknown site' });
  const { pathname } = new URL(req.url, 'http://x');
  const ip = String(req.headers['x-real-ip'] || req.socket.remoteAddress);

  /* Students' app */
  if (pathname === '/api/push/key' && req.method === 'GET') return send(res, 200, { key: vapid.publicKey });

  if (pathname === '/api/push/subscribe' && req.method === 'POST') {
    const { subscription: s, courses, lang } = await readJson(req);
    if (!validSubscription(s)) return send(res, 400, { error: 'bad subscription' });
    const list = cleanCourses(courses);
    const now = Date.now();
    const old = store.subs[s.endpoint];
    store.subs[s.endpoint] = { endpoint: s.endpoint, site, p256dh: s.keys.p256dh, auth: s.keys.auth, courses: list, lang: lang === 'en' ? 'en' : 'ar', created: old?.created ?? now, updated: now };
    save();
    return send(res, 200, { ok: true, courses: list });
  }

  if (pathname === '/api/push/unsubscribe' && req.method === 'POST') {
    const { endpoint } = await readJson(req);
    if (typeof endpoint === 'string' && store.subs[endpoint]?.site === site) {
      delete store.subs[endpoint];
      store.left.push({ site, at: Date.now() });
      save();
    }
    return send(res, 200, { ok: true });
  }

  // The browser replaced the push address (pushsubscriptionchange): keep the student's courses (or the test device).
  if (pathname === '/api/push/renew' && req.method === 'POST') {
    const { oldEndpoint, subscription: s } = await readJson(req);
    if (!validSubscription(s)) return send(res, 400, { error: 'bad subscription' });
    const book = typeof oldEndpoint === 'string' && store.tests[oldEndpoint]?.site === site ? store.tests : store.subs;
    const old = typeof oldEndpoint === 'string' && book[oldEndpoint]?.site === site ? book[oldEndpoint] : null;
    if (book === store.tests && !old) return send(res, 400, { error: 'unknown test device' });
    const now = Date.now();
    book[s.endpoint] = { ...(old || { courses: [], lang: 'ar', created: now }), endpoint: s.endpoint, site, p256dh: s.keys.p256dh, auth: s.keys.auth, updated: now };
    if (old && oldEndpoint !== s.endpoint) delete book[oldEndpoint];
    save();
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/push/click' && req.method === 'POST') {
    const { id } = await readJson(req, 256);
    const row = Number.isInteger(id) ? store.sends.find((x) => x.id === id && x.site === site) : null;
    if (row) { row.clicks++; save(); }
    return send(res, 204, null);
  }

  /* Owner's app: its files are public (they hold no data); every /admin/api/ call except sign-in needs a session. */
  if (pathname === '/admin/api/login' && req.method === 'POST') {
    const tries = recentFailures(ip);
    if (tries.length >= 8) return send(res, 429, { error: 'too many attempts' });
    const { password } = await readJson(req, 1024);
    if (!checkPassword(password)) {
      tries.push(Date.now());
      return send(res, 401, { error: 'wrong password' });
    }
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    store.sessions[tokenKey(token)] = { site, created: now, expires: now + SESSION_DAYS * DAY };
    for (const [k, v] of Object.entries(store.sessions)) if (v.expires < now) delete store.sessions[k];
    save();
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(site, token, SESSION_DAYS * 24 * 3600) });
  }

  if (pathname.startsWith('/admin/api/')) {
    if (!signedIn(req, site)) return send(res, 401, { error: 'sign in' });
    const action = pathname.slice('/admin/api/'.length);

    if (action === 'logout' && req.method === 'POST') {
      delete store.sessions[tokenKey(cookieOf(req, 'sp_admin'))];
      save();
      return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(site, '', 0) });
    }

    if (action === 'password' && req.method === 'POST') {
      const { current, next } = await readJson(req, 1024);
      if (!checkPassword(current)) return send(res, 400, { error: 'wrong password' });
      if (typeof next !== 'string' || next.length < 10 || next.length > 200) return send(res, 400, { error: 'too short' });
      writeFileSync(ADMIN_PATH, JSON.stringify({ password: hashPassword(next) }), { mode: 0o600 });
      // Every other signed-in device signs in again with the new password.
      const keep = tokenKey(cookieOf(req, 'sp_admin'));
      for (const k of Object.keys(store.sessions)) if (k !== keep) delete store.sessions[k];
      save();
      return send(res, 200, { ok: true });
    }

    if (action === 'overview' && req.method === 'GET') {
      const now = Date.now();
      const rows = subsOf(site);
      const perCourse = {};
      for (const r of rows) for (const c of r.courses) perCourse[c] = (perCourse[c] || 0) + 1;
      const real = store.sends.filter((x) => x.site === site && !x.test);
      return send(res, 200, {
        site,
        total: rows.length,
        newThisWeek: rows.filter((r) => now - r.created < 7 * DAY).length,
        leftThisWeek: store.left.filter((x) => x.site === site && now - x.at < 7 * DAY).length,
        perCourse,
        testDevices: testsOf(site).map(({ endpoint, label, created }) => ({ id: tokenKey(endpoint).slice(0, 12), label, created })),
        sends: real.filter((x) => x.status === 'sent' && now - x.sentAt < 7 * DAY).map(({ course, sentAt }) => ({ course, sentAt })),
        vapidKey: vapid.publicKey,
      });
    }

    if (action === 'history' && req.method === 'GET') {
      return send(res, 200, store.sends.filter((x) => x.site === site).slice(-200).reverse());
    }

    if (action === 'send' && req.method === 'POST') {
      const b = await readJson(req);
      const title = String(b.title || '').trim().slice(0, 80);
      const body = String(b.body || '').trim().slice(0, 240);
      if (!title || !body) return send(res, 400, { error: 'title and body are required' });
      const course = b.course && isId(b.course) ? b.course : null;
      const test = Boolean(b.test);
      if (test && !testsOf(site).length) return send(res, 400, { error: 'no test device' });
      const now = Date.now();
      const at = Number(b.at);
      const later = !test && Number.isFinite(at) && at > now + 60 * 1000;
      if (later && at > now + 60 * DAY) return send(res, 400, { error: 'too far ahead' });
      const record = {
        id: store.nextId++, site, status: later ? 'scheduled' : 'sending', created: now, sendAt: later ? at : now, sentAt: null,
        title, body, url: siteUrl(site, b.path || (course ? `courses/${course}` : '')), course, test: test ? 1 : 0,
        total: 0, delivered: 0, failed: 0, removed: 0, clicks: 0,
      };
      store.sends.push(record);
      save();
      return send(res, 200, later ? record : await deliver(record));
    }

    if (action === 'cancel' && req.method === 'POST') {
      const { id } = await readJson(req, 256);
      const row = store.sends.find((x) => x.id === id && x.site === site && x.status === 'scheduled');
      if (!row) return send(res, 404, { error: 'not scheduled' });
      row.status = 'canceled';
      save();
      return send(res, 200, row);
    }

    // The owner's own devices for test sends: the admin app subscribes itself.
    if (action === 'test-devices' && req.method === 'POST') {
      const { subscription: s, label } = await readJson(req);
      if (!validSubscription(s)) return send(res, 400, { error: 'bad subscription' });
      store.tests[s.endpoint] = { endpoint: s.endpoint, site, p256dh: s.keys.p256dh, auth: s.keys.auth, label: String(label || '').slice(0, 60), created: Date.now() };
      save();
      return send(res, 200, { ok: true });
    }
    if (action === 'test-devices/remove' && req.method === 'POST') {
      const { endpoint, id } = await readJson(req);
      for (const [k, v] of Object.entries(store.tests)) {
        if (v.site === site && (k === endpoint || tokenKey(k).slice(0, 12) === id)) delete store.tests[k];
      }
      save();
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'not found' });
  }

  if (pathname.startsWith('/admin/') && req.method === 'GET') {
    const file = ADMIN_FILES[pathname.slice('/admin/'.length)];
    const full = file && join(HERE, 'admin', file);
    if (!full || !existsSync(full)) return send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': TYPES[extname(full)], 'Cache-Control': 'no-cache' });
    return res.end(readFileSync(full));
  }

  return send(res, 404, { error: 'not found' });
}

http.createServer((req, res) => {
  route(req, res).catch((err) => {
    if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'server error' });
    if (!err.status) console.error(err);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`smartpro-push on 127.0.0.1:${PORT}`));
