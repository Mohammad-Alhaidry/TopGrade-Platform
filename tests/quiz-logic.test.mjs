import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBank } from '../public/assets/js/quiz/bank.js';
import { isCorrect, isAnswered, normalizeAnswer, matchingResults, correctAnswerText, responseText } from '../public/assets/js/quiz/grading.js';
import { createSession, optionOrder, shuffle, summarize } from '../public/assets/js/quiz/session.js';

const mcq = { id: 'm1', type: 'mcq', prompt: 'P?', options: ['a', 'b', 'c', 'All of the above'], answer: 'D' };
const tf = { id: 't1', type: 'tf', prompt: 'P', answer: false };
const fib = { id: 'f1', type: 'fib', prompt: 'The ___ one', answers: ['transistors', 'transistor'] };
const match = {
  id: 'x1',
  type: 'matching',
  title: 'T',
  pairs: [
    { left: 'L1', right: 'R1' },
    { left: 'L2', right: 'R2' },
    { left: 'L3', right: 'R3' },
  ],
};
const bank = {
  schemaVersion: 1,
  course: { id: 'c', titleEn: 'C' },
  topic: { id: 't', title: 'T' },
  questions: [mcq, tf, fib, match],
};

// Deterministic RNG so shuffles are reproducible.
// mulberry32: small seeds still give well-spread first values.
const seeded = (seed = 1) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

test('the shipped question bank is valid', () => {
  const real = JSON.parse(readFileSync(new URL('../public/data/problem-solving/topic-1.json', import.meta.url)));
  assert.deepEqual(validateBank(real), []);
});

test('validateBank reports broken questions', () => {
  const broken = structuredClone(bank);
  broken.questions.push({ id: 'm1', type: 'mcq', prompt: 'x', options: ['a', 'b'], answer: 'C' });
  broken.questions.push({ id: 'z', type: 'essay', prompt: 'x' });
  const errs = validateBank(broken).join('\n');
  assert.match(errs, /duplicate id/);
  assert.match(errs, /answer must be a letter A-B/);
  assert.match(errs, /unknown type "essay"/);
});

test('mcq grading uses the bank index, not display position', () => {
  assert.equal(isCorrect(mcq, 3), true);
  assert.equal(isCorrect(mcq, 0), false);
  assert.equal(isCorrect(mcq, undefined), false);
});

test('true/false grading', () => {
  assert.equal(isCorrect(tf, false), true);
  assert.equal(isCorrect(tf, true), false);
});

test('fill-in-the-blank ignores case, spacing, punctuation and accepts listed variants', () => {
  assert.equal(isCorrect(fib, '  Transistors. '), true);
  assert.equal(isCorrect(fib, 'TRANSISTOR'), true);
  assert.equal(isCorrect(fib, 'vacuum'), false);
  assert.equal(isAnswered(fib, '   '), false);
  assert.equal(normalizeAnswer('Babbage’s  Mill!'), "babbage's mill");
});

test('matching is correct only when every pair is right', () => {
  assert.equal(isCorrect(match, ['R1', 'R2', 'R3']), true);
  assert.equal(isCorrect(match, ['R1', 'R3', 'R2']), false);
  assert.deepEqual(matchingResults(match, ['R1', 'R3', 'R2']), [true, false, false]);
  assert.equal(isAnswered(match, ['R1', '', 'R3']), false);
});

test('answer text helpers', () => {
  assert.equal(correctAnswerText(mcq), 'All of the above');
  assert.equal(correctAnswerText(tf), 'False');
  assert.equal(responseText(mcq, 1), 'b');
  assert.equal(responseText(fib, undefined), null);
  assert.equal(correctAnswerText(match), 'L1 → R1\nL2 → R2\nL3 → R3');
});

test('optionOrder keeps "All of the above" last and is a permutation', () => {
  for (let s = 1; s < 50; s++) {
    const order = optionOrder(mcq, seeded(s));
    assert.equal(order[3], 3);
    assert.deepEqual([...order].sort(), [0, 1, 2, 3]);
  }
});

test('optionOrder actually varies the correct letter position', () => {
  const q = { ...mcq, options: ['a', 'b', 'c', 'd'], answer: 'B' };
  const positions = new Set();
  for (let s = 1; s < 50; s++) positions.add(optionOrder(q, seeded(s)).indexOf(1));
  assert.equal(positions.size, 4);
});

test('shuffle does not mutate its input', () => {
  const a = [1, 2, 3, 4];
  shuffle(a, seeded(3));
  assert.deepEqual(a, [1, 2, 3, 4]);
});

test('createSession filters by type, limits count and prepares display orders', () => {
  const s = createSession(bank, { types: ['mcq', 'matching'], count: 10, mode: 'exam', rng: seeded(7) });
  assert.equal(s.mode, 'exam');
  assert.equal(s.items.length, 2);
  for (const item of s.items) {
    if (item.question.type === 'mcq') assert.equal(item.optionOrder.length, 4);
    if (item.question.type === 'matching') assert.deepEqual([...item.choiceOrder].sort(), ['R1', 'R2', 'R3']);
  }
  assert.equal(createSession(bank, { count: 2, rng: seeded(1) }).items.length, 2);
  assert.throws(() => createSession(bank, { types: [] }), /No questions/);
  assert.throws(() => createSession(bank, { mode: 'speedrun' }), /Unknown mode/);
});

test('createSession can rebuild a run from specific ids (retry incorrect)', () => {
  const s = createSession(bank, { ids: ['t1', 'f1'], rng: seeded(2) });
  assert.deepEqual(s.items.map((i) => i.question.id).sort(), ['f1', 't1']);
});

test('summarize scores per type and counts unanswered as wrong', () => {
  const s = createSession(bank, { rng: seeded(5) });
  s.items.forEach((item, i) => {
    const q = item.question;
    if (q.type === 'mcq') s.responses[i] = 3;
    if (q.type === 'tf') s.responses[i] = true; // wrong
    if (q.type === 'matching') s.responses[i] = ['R1', 'R2', 'R3'];
    // fib left unanswered
  });
  const r = summarize(s);
  assert.equal(r.total, 4);
  assert.equal(r.correct, 2);
  assert.equal(r.answered, 3);
  assert.equal(r.percent, 50);
  assert.deepEqual(r.byType.tf, { correct: 0, total: 1 });
  assert.deepEqual(r.byType.fib, { correct: 0, total: 1 });
});

test('blankChoices: answer plus three distinct distractors from other blanks, case matched', async () => {
  const { blankChoices } = await import('../public/assets/js/quiz/session.js');
  const q = { id: 'f', type: 'fib', prompt: '___ operations repeat', answers: ['Iterative'] };
  const pool = ['Iterative', 'Sequential', 'algorithms', 'finite', 'ENIAC', 'iterative'];
  for (let s = 1; s < 30; s++) {
    const words = blankChoices(q, pool, seeded(s));
    assert.equal(words.length, 4);
    assert.ok(words.includes('Iterative'));
    assert.equal(new Set(words.map((w) => w.toLowerCase())).size, 4, 'no duplicates, answer not repeated');
    for (const w of words) assert.ok(/^[A-Z]/.test(w), `"${w}" should be capitalised like the answer`);
  }
});

test('blankChoices prefers same-case words and keeps acronyms intact', async () => {
  const { blankChoices } = await import('../public/assets/js/quiz/session.js');
  const q = { id: 'f', type: 'fib', prompt: 'It was ___.', answers: ['ENIAC'] };
  const words = blankChoices(q, ['ENIAC', 'EDVAC', 'Pascaline', 'storage', 'Mill'], seeded(4));
  assert.ok(words.includes('EDVAC'));
  assert.equal(words.length, 4);
});

test('blankChoices uses the question\'s own choices when given', async () => {
  const { blankChoices } = await import('../public/assets/js/quiz/session.js');
  const q = { id: 'f', type: 'fib', prompt: 'x ___', answers: ['vacuum'], choices: ['magnetic', 'punched', 'Vacuum'] };
  const words = blankChoices(q, ['algorithms', 'finite'], seeded(2));
  assert.deepEqual([...words].sort(), ['magnetic', 'punched', 'vacuum']);
});

test('createSession gives every fill-in-the-blank question word choices containing its answer', () => {
  const real = JSON.parse(readFileSync(new URL('../public/data/problem-solving/topic-1.json', import.meta.url)));
  const s = createSession(real, { types: ['fib'], rng: seeded(9) });
  assert.equal(s.items.length, 23);
  for (const it of s.items) {
    assert.equal(it.wordChoices.length, 4);
    assert.ok(it.wordChoices.some((w) => isCorrect(it.question, w)), it.question.id);
    assert.equal(it.wordChoices.filter((w) => isCorrect(it.question, w)).length, 1, `${it.question.id} has exactly one right word`);
  }
});
