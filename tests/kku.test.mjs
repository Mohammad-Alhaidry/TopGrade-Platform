import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fold, matches, postUrl, channelUrl, botUrl } from '../public/assets/js/app/kku.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8'));
const data = read('data/kku.json');
const catalog = read('data/catalog.json');

test('the KKU list: eight colleges, every course with its title, channel post and file count', () => {
  assert.equal(data.channel, 'ExamLeaks_KKU');
  assert.equal(data.bot, 'KingKhalidLeaks_bot');
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

test('search folds the spellings students mix up, and finds book courses by their English name', () => {
  assert.equal(fold('الإحصاء'), fold('الاحصاء'));
  assert.equal(fold('مقدمة'), fold('مقدمه'));
  assert.equal(fold('مبادى'), fold('مبادي'));
  assert.ok(matches({ title: 'الإحصاء التطبيقي' }, fold('احصاء')));
  assert.ok(matches({ title: 'إيفولف 2', en: 'Evolve 2' }, fold('evolve')));
  assert.ok(!matches({ title: 'الجبر الخطي' }, fold('احصاء')));
  assert.ok(matches({ title: 'الجبر الخطي' }, ''));
});

test('links go to the channel post, the channel and the bot', () => {
  assert.equal(postUrl(data, 42), 'https://t.me/ExamLeaks_KKU/42');
  assert.equal(channelUrl(data), 'https://t.me/ExamLeaks_KKU');
  assert.equal(botUrl(data), 'https://t.me/KingKhalidLeaks_bot');
});
