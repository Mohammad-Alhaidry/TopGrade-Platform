import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fold, matches, postUrl, channelUrl, botUrl, uniUrl, TG_KINDS, tgUrl } from '../public/assets/js/app/kku.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8'));
const data = read('data/kku.json');
const catalog = read('data/catalog.json');

test('the KKU list: eight colleges, every course with its title, channel post and file count', () => {
  assert.equal(data.channel, 'ExamLeaks_KKU');
  assert.equal(data.bot, 'KingKhalidLeaks_bot');
  assert.equal(data.uni, 'Kku_One');
  const ids = data.colleges.map((c) => c.id);
  assert.deepEqual(ids, ['applied', 'business', 'computing', 'health', 'science', 'engineering', 'english', 'other']);
  for (const col of data.colleges) {
    assert.ok(col.name && col.en && col.courses.length, col.id);
    for (const c of col.courses) {
      assert.ok(c.title && Number.isInteger(c.post) && c.post > 0 && Number.isInteger(c.files) && c.files > 0, c.title);
      assert.doesNotMatch(c.title, /[A-Za-z]/, `English on the Arabic screen: ${c.title}`);
    }
  }
  assert.ok(data.total >= 140);
});

test('the four Smart Pro courses the channel also has point at their channel post', () => {
  assert.deepEqual(Object.keys(data.smartpro).sort(), ['business-math', 'calculus-1', 'principles-of-accounting-1', 'problem-solving']);
  for (const [id, post] of Object.entries(data.smartpro)) {
    assert.ok(catalog.courses.some((c) => c.id === id), id);
    assert.ok(data.colleges.some((col) => col.courses.some((c) => c.post === post)), id);
  }
});

test('the Telegram directory: five channels, nine bots, nine groups, each with its name and line in both languages', () => {
  assert.deepEqual(TG_KINDS, ['channels', 'bots', 'groups']);
  assert.deepEqual(TG_KINDS.map((k) => data.telegram[k].length), [5, 9, 9]);
  const handles = TG_KINDS.flatMap((k) => data.telegram[k].map((i) => i.handle));
  assert.equal(new Set(handles).size, handles.length, 'a handle listed twice');
  for (const kind of TG_KINDS) {
    for (const item of data.telegram[kind]) {
      assert.match(item.handle, /^[A-Za-z][A-Za-z0-9_]{4,31}$/, item.handle);
      assert.ok(item.title && item.sub && item.en && item.enSub, item.handle);
      assert.doesNotMatch(item.title + item.sub, /[A-Za-z]/, `English on the Arabic screen: ${item.handle}`);
    }
  }
  for (const h of [data.channel, data.bot, data.uni]) assert.ok(handles.includes(h), h);
  assert.equal(tgUrl('TalkKKU'), 'https://t.me/TalkKKU');
});

test('search folds the spellings students mix up, and finds book courses by their English name', () => {
  assert.equal(fold('الإحصاء'), fold('الاحصاء'));
  assert.equal(fold('مقدمة'), fold('مقدمه'));
  assert.equal(fold('مبادى'), fold('مبادي'));
  assert.ok(matches({ title: 'الإحصاء التطبيقي' }, fold('احصاء')));
  assert.ok(matches({ title: 'إيفولف 2', en: 'Evolve 2' }, fold('evolve')));
  assert.ok(!matches({ title: 'الجبر الخطي' }, fold('احصاء')));
  assert.ok(matches({ title: 'الجبر الخطي' }, ''));
});

test('links go to the channel post, the channel, the bot and the university channel', () => {
  assert.equal(postUrl(data, 42), 'https://t.me/ExamLeaks_KKU/42');
  assert.equal(channelUrl(data), 'https://t.me/ExamLeaks_KKU');
  assert.equal(botUrl(data), 'https://t.me/KingKhalidLeaks_bot');
  assert.equal(uniUrl(data), 'https://t.me/Kku_One');
});

test('the /kku address opens the list; anything under it is not found', async () => {
  const { matchRoute, paths } = await import('../public/assets/js/app/routes.js');
  assert.deepEqual(matchRoute('kku'), { name: 'kku', params: {} });
  assert.deepEqual(matchRoute('/kku/'), { name: 'kku', params: {} });
  assert.equal(matchRoute('kku/x').name, 'notfound');
  assert.equal(matchRoute(paths.kku()).name, 'kku');
});

test('the page title names the channel in both languages', async () => {
  const { pageTitle, pageDescription } = await import('../public/assets/js/app/meta.js');
  const route = { name: 'kku', params: {} };
  assert.equal(pageTitle(route, catalog, 'ar'), 'تسريبات وتجميعات جامعة الملك خالد | سمارت برو');
  assert.match(pageTitle(route, catalog, 'en'), /^KKU leaks and collections \| Smart Pro$/);
  assert.match(pageDescription(route, catalog, 'ar'), /تسريبات وتجميعات جامعة الملك خالد/);
});

test('search engines read a /kku page with every course as a link to its post, and the sitemap lists it', async () => {
  const { generated } = await import('../tools/build-pages.mjs');
  const files = generated();
  const page = files['pages/kku.html'];
  assert.ok(page, 'pages/kku.html');
  assert.match(page, /<title>تسريبات وتجميعات جامعة الملك خالد \| سمارت برو<\/title>/);
  assert.match(page, /<link rel="canonical" href="https:\/\/smartpro-edu\.com\/kku">/);
  assert.match(page, /<h1>تسريبات وتجميعات جامعة الملك خالد<\/h1>/);
  assert.ok(page.includes('href="https://t.me/ExamLeaks_KKU"') && page.includes('href="https://t.me/KingKhalidLeaks_bot"'));
  assert.ok(page.includes('<a href="https://t.me/Kku_One">قناة جامعة الملك خالد</a>'), 'the university channel');
  for (const col of data.colleges) {
    assert.ok(page.includes(`<h2>${col.name}</h2>`), col.name);
    for (const c of col.courses) assert.ok(page.includes(`href="https://t.me/ExamLeaks_KKU/${c.post}"`), c.title);
  }
  assert.match(files['sitemap.xml'], /<loc>https:\/\/smartpro-edu\.com\/kku<\/loc>/);
});

test('the home page search engines read links to the /kku page and to the university channel', async () => {
  const { generated } = await import('../tools/build-pages.mjs');
  const home = generated()['pages/index.html'];
  assert.ok(home, 'pages/index.html');
  assert.ok(home.includes('<a href="kku">تسريبات وتجميعات جامعة الملك خالد</a>'), 'the /kku page');
  assert.ok(home.includes('<a href="https://t.me/Kku_One">قناة جامعة الملك خالد</a>'), 'the university channel');
});
