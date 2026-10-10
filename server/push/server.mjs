// Smart Pro push notifications.
// Students' browsers subscribe through /api/push/ (no personal data: only the push address the browser gives us
// and the courses the student follows). The owner sends from /admin/ (nginx asks for the admin password first).
// nginx tells us which site a request is for with X-Site: "live" (/...) or "preview" (/preview/...); the two
// sites keep separate subscribers and history.
//
// Environment: PORT (default 3120), PUSH_DB (default /var/lib/smartpro-push/push.json),
// PUSH_VAPID (default /etc/smartpro-push/vapid.json: { publicKey, privateKey, subject }).

import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpush from 'web-push';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3120);
const DB_PATH = process.env.PUSH_DB || '/var/lib/smartpro-push/push.json';
const VAPID_PATH = process.env.PUSH_VAPID || '/etc/smartpro-push/vapid.json';
const SITES = { live: 'https://smartpro-edu.com/', preview: 'https://smartpro-edu.com/preview/' };

// Push services the server may post to. Anything else is refused, so a subscription cannot make this server send
// requests to an arbitrary address.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/,
  /\.notify\.windows\.com$/, /^android\.googleapis\.com$/];

const vapid = JSON.parse(readFileSync(VAPID_PATH, 'utf8'));
webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

// Storage: one small JSON file (a few thousand subscriptions at most), rewritten atomically after each change.
mkdirSync(dirname(DB_PATH), { recursive: true });
const store = existsSync(DB_PATH) ? JSON.parse(readFileSync(DB_PATH, 'utf8')) : { subs: {}, sends: [], nextId: 1 };
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    writeFileSync(`${DB_PATH}.tmp`, JSON.stringify(store));
    renameSync(`${DB_PATH}.tmp`, DB_PATH);
  }, 200);
}
const subsOf = (site) => Object.values(store.subs).filter((r) => r.site === site);
const findSend = (site, id) => store.sends.find((x) => x.id === id && x.site === site);

/* ---------- helpers ---------- */

const send = (res, status, body, headers = {}) => {
  const json = typeof body !== 'string';
  res.writeHead(status, { 'Content-Type': json ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(json ? JSON.stringify(body) : body);
};

function readJson(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('bad json'), { status: 400 })); }
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
  const base = SITES[site];
  const url = new URL(String(path || '').replace(/^\/+/, ''), base);
  return url.href.startsWith(base) ? url.href : base;
}

/* ---------- sending ---------- */

async function deliver(site, { title, body, url, course, test }) {
  const now = Date.now();
  let rows = subsOf(site);
  if (test) rows = rows.sort((a, b) => b.updated - a.updated).slice(0, 1);
  else if (course) rows = rows.filter((r) => r.courses.includes(course));

  const id = store.nextId++;
  const record = { id, site, created: now, title, body, url, course: course || null, test: test ? 1 : 0, total: rows.length, delivered: 0, failed: 0, removed: 0, clicks: 0 };
  store.sends.push(record);
  save();
  const payload = JSON.stringify({ id, title, body, url, tag: course ? `course-${course}` : 'smartpro' });

  let delivered = 0, failed = 0, removed = 0;
  const queue = [...rows];
  const worker = async () => {
    for (let r = queue.shift(); r; r = queue.shift()) {
      try {
        await webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload, { TTL: 3 * 24 * 3600, urgency: 'normal' });
        delivered++;
      } catch (err) {
        failed++;
        // Gone or invalid: the student uninstalled, cleared the site or turned notifications off.
        if ([404, 410].includes(err.statusCode)) { delete store.subs[r.endpoint]; removed++; }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(20, queue.length) }, worker));
  Object.assign(record, { delivered, failed, removed });
  save();
  return { id, total: rows.length, delivered, failed, removed };
}

/* ---------- admin page files ---------- */

const ADMIN_FILES = { '': 'index.html', 'index.html': 'index.html', 'admin.js': 'admin.js', 'admin.css': 'admin.css' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

/* ---------- routes ---------- */

async function route(req, res) {
  const site = req.headers['x-site'];
  if (!SITES[site]) return send(res, 400, { error: 'unknown site' });
  const { pathname } = new URL(req.url, 'http://x');

  // Public: the student's app.
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
    if (typeof endpoint === 'string' && store.subs[endpoint]?.site === site) { delete store.subs[endpoint]; save(); }
    return send(res, 200, { ok: true });
  }

  // The browser replaced the push address (pushsubscriptionchange): keep the student's courses.
  if (pathname === '/api/push/renew' && req.method === 'POST') {
    const { oldEndpoint, subscription: s } = await readJson(req);
    if (!validSubscription(s)) return send(res, 400, { error: 'bad subscription' });
    const old = typeof oldEndpoint === 'string' && store.subs[oldEndpoint]?.site === site ? store.subs[oldEndpoint] : null;
    const now = Date.now();
    const cur = store.subs[s.endpoint];
    store.subs[s.endpoint] = { endpoint: s.endpoint, site, p256dh: s.keys.p256dh, auth: s.keys.auth, courses: cur?.courses ?? old?.courses ?? [], lang: cur?.lang ?? old?.lang ?? 'ar', created: cur?.created ?? old?.created ?? now, updated: now };
    if (old && oldEndpoint !== s.endpoint) delete store.subs[oldEndpoint];
    save();
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/push/click' && req.method === 'POST') {
    const { id } = await readJson(req, 256);
    const row = Number.isInteger(id) ? findSend(site, id) : null;
    if (row) { row.clicks++; save(); }
    return send(res, 204, '');
  }

  // Admin (nginx has already checked the password).
  if (pathname.startsWith('/admin/api/')) {
    if (pathname === '/admin/api/stats' && req.method === 'GET') {
      const rows = subsOf(site);
      const perCourse = {};
      for (const r of rows) for (const c of r.courses) perCourse[c] = (perCourse[c] || 0) + 1;
      const last = rows.reduce((m, r) => Math.max(m, r.updated), 0);
      return send(res, 200, { site, total: rows.length, perCourse, lastSubscribed: last || null });
    }
    if (pathname === '/admin/api/history' && req.method === 'GET') {
      return send(res, 200, store.sends.filter((x) => x.site === site).slice(-100).reverse());
    }
    if (pathname === '/admin/api/send' && req.method === 'POST') {
      if (req.headers['content-type']?.split(';')[0] !== 'application/json') return send(res, 415, { error: 'json only' });
      const b = await readJson(req);
      const title = String(b.title || '').trim().slice(0, 80);
      const body = String(b.body || '').trim().slice(0, 240);
      if (!title || !body) return send(res, 400, { error: 'title and body are required' });
      const course = b.course && isId(b.course) ? b.course : null;
      const url = siteUrl(site, b.path || (course ? `courses/${course}` : ''));
      return send(res, 200, await deliver(site, { title, body, url, course, test: Boolean(b.test) }));
    }
    return send(res, 404, { error: 'not found' });
  }

  if (pathname.startsWith('/admin/') && req.method === 'GET') {
    const file = ADMIN_FILES[pathname.slice('/admin/'.length)];
    if (!file) return send(res, 404, 'not found');
    const full = join(HERE, 'admin', file);
    if (!existsSync(full)) return send(res, 404, 'not found');
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
