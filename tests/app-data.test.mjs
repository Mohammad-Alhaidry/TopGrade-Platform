import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validateCatalog, findTopic } from '../public/assets/js/app/catalog.js';
import { validateBank } from '../public/assets/js/quiz/bank.js';
import { emptyProgress, recordAnswers, recordRun, topicStats, overall, streak, dayKey } from '../public/assets/js/app/progress.js';

const dataDir = new URL('../public/data/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', dataDir)));

test('the shipped catalog is valid and every topic bank exists, is valid and matches its catalog entry', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  for (const course of catalog.courses) {
    for (const topic of course.topics) {
      const file = new URL(topic.bank, dataDir);
      assert.ok(existsSync(file), `${topic.bank} is missing`);
      const bank = JSON.parse(readFileSync(file));
      assert.deepEqual(validateBank(bank), [], topic.bank);
      assert.equal(bank.course.id, course.id, `${topic.bank} course id`);
      assert.equal(bank.topic.id, topic.id, `${topic.bank} topic id`);
    }
  }
});

test('validateCatalog reports bad ids, duplicates and bank paths', () => {
  const bad = {
    schemaVersion: 1,
    courses: [
      { id: 'Bad Id', titleEn: 'X', topics: [{ id: 't', number: 1, title: 'T', bank: '../etc/passwd' }] },
      { id: 'c', titleEn: 'C', topics: [{ id: 't', number: 0, title: 'T', bank: 'c/t.json' }, { id: 't', number: 2, title: 'U', bank: 'c/u.json' }] },
    ],
  };
  const errs = validateCatalog(bad).join('\n');
  assert.match(errs, /id must be lowercase-with-dashes/);
  assert.match(errs, /bank must look like/);
  assert.match(errs, /number must be a positive integer/);
  assert.match(errs, /duplicate id/);
});

test('findTopic resolves course and topic ids', () => {
  assert.equal(findTopic(catalog, 'problem-solving', 'topic-1').topic.number, 1);
  assert.equal(findTopic(catalog, 'problem-solving', 'nope'), null);
  assert.equal(findTopic(catalog, 'nope', 'topic-1'), null);
});

const T = 'c/t';
const day = (n) => new Date(2026, 9, n, 12).getTime();

test('a wrong answer adds a mistake; two right answers in a row clear it', () => {
  let p = recordAnswers(emptyProgress(), T, [{ id: 'a', correct: false }, { id: 'b', correct: true }], day(1));
  assert.deepEqual(topicStats(p, T, ['a', 'b', 'c']).mistakes, ['a']);
  p = recordAnswers(p, T, [{ id: 'a', correct: true }], day(1));
  assert.deepEqual(topicStats(p, T, ['a', 'b', 'c']).mistakes, ['a'], 'one right answer is not enough');
  p = recordAnswers(p, T, [{ id: 'a', correct: false }, { id: 'a', correct: true }, { id: 'a', correct: true }], day(1));
  assert.deepEqual(topicStats(p, T, ['a', 'b', 'c']).mistakes, []);
});

test('topicStats counts answered and mastered questions, ignoring ones no longer in the bank', () => {
  const p = recordAnswers(emptyProgress(), T, [{ id: 'a', correct: false }, { id: 'b', correct: true }, { id: 'gone', correct: true }], day(1));
  const s = topicStats(p, T, ['a', 'b', 'c', 'd']);
  assert.deepEqual({ total: s.total, answered: s.answered, mastered: s.mastered, percent: s.percent }, { total: 4, answered: 2, mastered: 1, percent: 25 });
  assert.deepEqual(topicStats(emptyProgress(), T, ['a']).best, null);
});

test('recordRun keeps the best score of full quizzes only', () => {
  let p = recordRun(emptyProgress(), T, { percent: 60, counts: true }, day(1));
  p = recordRun(p, T, { percent: 100, counts: false }, day(1));
  p = recordRun(p, T, { percent: 40, counts: true }, day(1));
  const s = topicStats(p, T, []);
  assert.equal(s.best, 60);
  assert.equal(s.runs, 3);
  assert.equal(p.topics[T].lastScore, 40);
});

test('overall totals answers, accuracy and open mistakes', () => {
  const p = recordAnswers(emptyProgress(), T, [{ id: 'a', correct: false }, { id: 'b', correct: true }, { id: 'c', correct: true }, { id: 'd', correct: true }], day(1));
  assert.deepEqual(overall(p), { answered: 4, accuracy: 75, mistakes: 1 });
  assert.deepEqual(overall(emptyProgress()), { answered: 0, accuracy: null, mistakes: 0 });
});

test('streak counts consecutive days ending today or yesterday', () => {
  let p = emptyProgress();
  for (const d of [1, 3, 4, 5]) p = recordAnswers(p, T, [{ id: 'a', correct: true }], day(d));
  assert.equal(streak(p, day(5)), 3);
  assert.equal(streak(p, day(6)), 3, 'still alive the next day');
  assert.equal(streak(p, day(7)), 0);
  assert.equal(dayKey(day(5)), '2026-10-05');
});

test('recording does not mutate the previous progress object', () => {
  const before = emptyProgress();
  recordAnswers(before, T, [{ id: 'a', correct: true }], day(1));
  assert.deepEqual(before, emptyProgress());
});

test('mixed topics (the practice midterm) are up to date with their source topics (run `npm run build`)', async () => {
  const { isCurrent } = await import('../tools/build-mixed.mjs');
  assert.ok(isCurrent());
});

test('validateCatalog checks content language, labels, setup defaults and mixed topics', () => {
  const topic = (id, extra = {}) => ({ id, number: 1, title: 'T', bank: `c/${id}.json`, ...extra });
  const ok = { schemaVersion: 1, courses: [{ id: 'c', titleEn: 'C', lang: 'ar', topics: [
    topic('a', { label: { en: 'Chapter 1', ar: 'الفصل الأول' } }),
    topic('b'),
    topic('m', { mix: ['a', 'b'], defaults: { mode: 'exam', count: 40 } }),
  ] }] };
  assert.deepEqual(validateCatalog(ok), []);
  const bad = { schemaVersion: 1, courses: [{ id: 'c', titleEn: 'C', lang: 'fr', topics: [
    topic('a', { label: { en: 'Chapter 1' } }),
    topic('m', { mix: ['a', 'nope'], defaults: { mode: 'quiz', count: 7 } }),
  ] }] };
  const errs = validateCatalog(bad).join('\n');
  for (const re of [/lang must be/, /label needs en and ar/, /mix must list/, /defaults need/]) assert.match(errs, re);
});

test('math courses: every \\( ... \\) renders in Temml, and matching answers (dropdowns) stay plain text', async () => {
  const { runInNewContext } = await import('node:vm');
  const ctx = {};
  runInNewContext(`${readFileSync(new URL('../public/assets/vendor/temml/temml.min.js', import.meta.url), 'utf8')};globalThis.temml=temml;`, ctx);
  for (const course of catalog.courses.filter((c) => c.math)) {
    for (const topic of course.topics) {
      const bank = JSON.parse(readFileSync(new URL(topic.bank, dataDir)));
      for (const q of bank.questions) {
        const texts = [q.prompt, q.title, q.explanation, ...(q.options ?? []), ...(q.pairs ?? []).map((p) => p.left)].filter(Boolean);
        for (const text of texts) {
          assert.equal((text.match(/\\\(/g) ?? []).length, (text.match(/\\\)/g) ?? []).length, `${topic.bank} ${q.id}: unbalanced \\( \\)`);
          for (const m of text.matchAll(/\\\((.+?)\\\)/gs)) assert.doesNotThrow(() => ctx.temml.renderToString(m[1], { throwOnError: true }), `${topic.bank} ${q.id}: ${m[1]}`);
        }
        for (const p of q.pairs ?? []) assert.doesNotMatch(p.right, /\\\(/, `${topic.bank} ${q.id}: matching right side must be plain`);
      }
    }
  }
});

test('every question figure exists', () => {
  for (const course of catalog.courses) {
    for (const topic of course.topics) {
      const bank = JSON.parse(readFileSync(new URL(topic.bank, dataDir)));
      for (const q of bank.questions.filter((x) => x.image)) assert.ok(existsSync(new URL(q.image.src, dataDir)), `${topic.bank} ${q.id}: ${q.image.src} missing`);
    }
  }
});
