import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeRun, deserializeRun } from '../public/assets/js/quiz/store.js';
import { createSession } from '../public/assets/js/quiz/session.js';

const bank = {
  schemaVersion: 1,
  course: { id: 'c', titleEn: 'C' },
  topic: { id: 't', title: 'T' },
  questions: [
    { id: 'm1', type: 'mcq', prompt: 'P?', options: ['a', 'b', 'c'], answer: 'B' },
    { id: 't1', type: 'tf', prompt: 'P', answer: true },
    { id: 'x1', type: 'matching', title: 'T', pairs: [{ left: 'L1', right: 'R1' }, { left: 'L2', right: 'R2' }] },
    { id: 'f1', type: 'fib', prompt: 'A ___ b', answers: ['alpha'] },
    { id: 'f2', type: 'fib', prompt: 'C ___ d', answers: ['beta'] },
  ],
};

function sampleRun() {
  const session = createSession(bank, { mode: 'practice' });
  session.responses[0] = session.items[0].question.type === 'tf' ? true : undefined;
  return { session, index: 2, checked: [true, false, false, false, false], startedAt: 1000, finishedAt: null };
}

test('a saved run round-trips with the same questions, orders, answers and position', () => {
  const run = sampleRun();
  const data = JSON.parse(JSON.stringify(serializeRun(bank, run)));
  const back = deserializeRun(bank, data, data.savedAt + 1000);
  assert.deepEqual(back.session.items.map((i) => i.question.id), run.session.items.map((i) => i.question.id));
  assert.deepEqual(back.session.items.map((i) => i.optionOrder), run.session.items.map((i) => i.optionOrder));
  assert.deepEqual(back.session.items.map((i) => i.choiceOrder), run.session.items.map((i) => i.choiceOrder));
  assert.deepEqual(back.session.responses, run.session.responses);
  assert.equal(back.index, 2);
  assert.deepEqual(back.checked, [true, false, false, false, false]);
  assert.deepEqual(back.session.items.map((i) => i.wordChoices), run.session.items.map((i) => i.wordChoices));
  assert.equal(back.startedAt, 1000);
});

test('runs from another bank, an old version or older than a week are ignored', () => {
  const data = serializeRun(bank, sampleRun());
  assert.equal(deserializeRun({ ...bank, topic: { id: 'other', title: 'X' } }, data, data.savedAt), null);
  assert.equal(deserializeRun(bank, { ...data, v: 0 }, data.savedAt), null);
  assert.equal(deserializeRun(bank, data, data.savedAt + 8 * 24 * 3600 * 1000), null);
  assert.equal(deserializeRun(bank, null), null);
});

test('a run is discarded when the bank no longer has its questions in the same shape', () => {
  const data = serializeRun(bank, sampleRun());
  const removed = { ...bank, questions: bank.questions.filter((q) => q.id !== 't1') };
  assert.equal(deserializeRun(removed, data, data.savedAt), null);
  const moreOptions = { ...bank, questions: bank.questions.map((q) => (q.id === 'm1' ? { ...q, options: [...q.options, 'd'] } : q)) };
  assert.equal(deserializeRun(moreOptions, data, data.savedAt), null);
  const renamedPair = { ...bank, questions: bank.questions.map((q) => (q.id === 'x1' ? { ...q, pairs: [{ left: 'L1', right: 'R9' }, q.pairs[1]] } : q)) };
  assert.equal(deserializeRun(renamedPair, data, data.savedAt), null);
});

test('an out-of-range position falls back to the first question', () => {
  const data = { ...serializeRun(bank, sampleRun()), index: 99 };
  assert.equal(deserializeRun(bank, data, data.savedAt).index, 0);
});

test('a saved blank whose word choices lost the answer is discarded', () => {
  const run = sampleRun();
  const data = JSON.parse(JSON.stringify(serializeRun(bank, run)));
  const fib = data.items.find((it) => it.id === 'f1');
  fib.w = ['gamma', 'delta'];
  assert.equal(deserializeRun(bank, data, data.savedAt), null);
});
