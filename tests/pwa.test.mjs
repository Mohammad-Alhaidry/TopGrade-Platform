import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { isCurrent } from '../tools/build-sw.mjs';

const pub = new URL('../public/', import.meta.url);
const sw = readFileSync(new URL('sw.js', pub), 'utf8');
const files = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1]);

test('index.html preload list and sw.js offline list are up to date (run `npm run build` after changing public/)', () => {
  assert.ok(isCurrent());
});

test('the offline list covers the app shell, code, styles, fonts and every question bank', () => {
  for (const f of ['index.html', 'manifest.webmanifest', 'assets/js/app/main.js', 'assets/css/app.css', 'data/catalog.json', 'assets/fonts/cairo-latin.woff2', 'assets/fonts/cairo-arabic.woff2']) {
    assert.ok(files.includes(f), `${f} missing from offline list`);
  }
  const catalog = JSON.parse(readFileSync(new URL('data/catalog.json', pub)));
  for (const c of catalog.courses) for (const t of c.topics) assert.ok(files.includes(`data/${t.bank}`), `${t.bank} not cached`);
  for (const f of files) assert.ok(existsSync(new URL(f, pub)), `${f} listed but missing`);
});

test('manifest meets install requirements: name, standalone, start_url in scope, 192 and 512 icons incl. maskable', () => {
  const m = JSON.parse(readFileSync(new URL('manifest.webmanifest', pub)));
  assert.equal(m.display, 'standalone');
  assert.ok(m.name && m.short_name && m.start_url.startsWith('./') && m.scope === './');
  const sizes = (purpose) => m.icons.filter((i) => i.purpose === purpose).map((i) => i.sizes);
  for (const purpose of ['any', 'maskable']) assert.deepEqual(sizes(purpose).sort(), ['192x192', '512x512']);
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src, pub)), i.src);
});

test('index.html links the manifest and declares the base path the router relies on', () => {
  const html = readFileSync(new URL('index.html', pub), 'utf8');
  assert.match(html, /<base href="\/">/);
  assert.match(html, /rel="manifest" href="manifest.webmanifest"/);
  assert.match(html, /assets\/js\/app\/main\.js/);
});

test('first visit preloads every app module; the splash shows the full logo, not a loading text', () => {
  const html = readFileSync(new URL('index.html', pub), 'utf8');
  for (const f of files.filter((f) => f.startsWith('assets/js/app/') || f.startsWith('assets/js/quiz/'))) {
    assert.match(html, new RegExp(`rel="modulepreload" href="${f.replace(/[.]/g, '\\.')}"`), `${f} not preloaded`);
  }
  assert.match(html, /class="splash"/);
  assert.match(html, /assets\/img\/logo-full\.png/);
  assert.doesNotMatch(html, /Loading…/);
});

test('service worker serves the app from cache and waits for a safe moment to update', () => {
  assert.match(sw, /respondWith\(fromCache\(SHELL\)\)/);
  assert.match(sw, /SKIP_WAITING/);
  assert.doesNotMatch(sw, /networkFirst/);
});
