import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRINGS, t, LANGS, DEFAULT_LANG } from '../public/assets/js/app/i18n.js';

test('every interface string exists in English and Arabic, with an "other" form for plurals', () => {
  for (const [key, entry] of Object.entries(STRINGS)) {
    for (const lang of LANGS) {
      const v = entry[lang];
      assert.ok(v !== undefined && v !== '', `${key} missing ${lang}`);
      if (typeof v === 'object') assert.ok(v.other, `${key} ${lang} plural needs "other"`);
    }
  }
});

test('placeholders match between languages', () => {
  const names = (v) => [...new Set(JSON.stringify(v).match(/\{\w+\}/g) ?? [])].sort();
  for (const [key, entry] of Object.entries(STRINGS)) {
    const en = names(entry.en);
    for (const p of names(entry.ar)) assert.ok(en.includes(p) || p === '{n}', `${key}: Arabic uses ${p} which English lacks`);
  }
});

test('Arabic plurals follow Arabic number grammar', () => {
  assert.equal(t('n.questions', { n: 1 }, 'ar'), 'سؤال واحد');
  assert.equal(t('n.questions', { n: 2 }, 'ar'), 'سؤالان');
  assert.equal(t('n.questions', { n: 5 }, 'ar'), '5 أسئلة');
  assert.equal(t('n.questions', { n: 20 }, 'ar'), '20 سؤالًا');
  assert.equal(t('n.questions', { n: 118 }, 'ar'), '118 سؤالًا');
  assert.equal(t('n.questions', { n: 100 }, 'ar'), '100 سؤال');
  assert.equal(t('n.questions', { n: 1 }, 'en'), '1 question');
  assert.equal(t('n.questions', { n: 3 }, 'en'), '3 questions');
});

test('placeholders are filled and unknown keys are visible', () => {
  assert.equal(t('qOfN', { i: 3, n: 10 }, 'en'), 'Question 3 of 10');
  assert.equal(t('qOfN', { i: 3, n: 10 }, 'ar'), 'السؤال 3 من 10');
  assert.equal(t('no.such.key'), 'no.such.key');
});

test('first visit opens in Arabic, and the page head agrees before the app loads', () => {
  assert.equal(DEFAULT_LANG, 'ar');
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="ar" dir="rtl">/);
  const boot = readFileSync(new URL('../public/assets/js/boot.js', import.meta.url), 'utf8');
  assert.match(html, /<script src="assets\/js\/boot\.js"><\/script>/);
  assert.match(boot, /getItem\('topgrade\.lang'\) === 'en'\) \{ d\.lang = 'en'; d\.dir = 'ltr'; \}/);
});
