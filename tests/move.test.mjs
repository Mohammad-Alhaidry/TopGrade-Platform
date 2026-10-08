import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// The old address (moved/move.js) packs a device's saved progress into the link; the new address
// (public/assets/js/boot.js) unpacks it. Run both as a browser would and check what arrives.
const move = readFileSync(new URL('../moved/move.js', import.meta.url), 'utf8');
const boot = readFileSync(new URL('../public/assets/js/boot.js', import.meta.url), 'utf8');

function storage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), dump: () => Object.fromEntries(m) };
}

function leaveOldAddress(saved, path = '/courses/problem-solving/topic-1') {
  let target = null;
  const location = { pathname: path, search: '', replace: (u) => { target = u; } };
  runInNewContext(move, { localStorage: storage(saved), location, TextEncoder, btoa });
  return target;
}

function arriveAtNewAddress(link, existing = {}) {
  const u = new URL(link);
  const ls = storage(existing);
  const location = { hash: u.hash, pathname: u.pathname, search: u.search };
  let replaced = null;
  const document = { documentElement: { dataset: {}, classList: { add() {} } } };
  const matchMedia = () => ({ matches: false });
  runInNewContext(boot, { localStorage: ls, location, history: { state: null, replaceState: (s, t, url) => { replaced = url; } }, TextDecoder, atob, document, matchMedia, navigator: {} });
  return { stored: ls.dump(), address: replaced };
}

const saved = {
  'topgrade.progress.v1': JSON.stringify({ v: 1, topics: { 'problem-solving/topic-1': { best: 80, note: 'تجربة ✓' } } }),
  'topgrade.run.v1': JSON.stringify({ index: 4 }),
  'topgrade.lang': 'en',
  'topgrade.theme': 'dark',
  'topgrade.install.dismissed': '123',
};

test('a student moves to the same page on the new address, with progress, run, language and theme', () => {
  const link = leaveOldAddress(saved);
  assert.match(link, /^https:\/\/smartpro-edu\.com\/courses\/problem-solving\/topic-1#tg-import=[A-Za-z0-9_-]+$/);
  const { stored, address } = arriveAtNewAddress(link);
  for (const k of ['topgrade.progress.v1', 'topgrade.run.v1', 'topgrade.lang', 'topgrade.theme']) assert.equal(stored[k], saved[k], k);
  assert.equal(stored['topgrade.install.dismissed'], undefined, 'the new address offers its own app');
  assert.equal(address, '/courses/problem-solving/topic-1', 'the import is taken out of the address');
});

test('a student with nothing saved moves with a plain link', () => {
  assert.equal(leaveOldAddress({}, '/'), 'https://smartpro-edu.com/');
});

test('progress already on the new address is never overwritten, and a damaged link is ignored', () => {
  const link = leaveOldAddress(saved);
  const { stored } = arriveAtNewAddress(link, { 'topgrade.progress.v1': 'newer' });
  assert.equal(stored['topgrade.progress.v1'], 'newer');
  assert.equal(stored['topgrade.lang'], 'en');
  const broken = arriveAtNewAddress('https://smartpro-edu.com/#tg-import=bm90LWpzb24');
  assert.equal(broken.stored['topgrade.progress.v1'], undefined);
  assert.equal(broken.address, '/');
});
