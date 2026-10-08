import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankText } from '../tools/import-bank.mjs';

const sample = `1) MCQ

Q1

Computer science is the study of:

A. Computers only
B. Algorithms

Answer: B

---

2) True / False

Q1

An infinite loop runs forever.

Answer: True

3) Fill in the Blank

Q1

The second generation used ________ instead of vacuum tubes.

Answer: transistors | transistor

4) Matching

Matching 1 — Generations

A\tB

1. First generation\tA. Integrated circuits
2. Third generation\tB. Vacuum tubes

Answers:
1 → B
2 → A
`;

test('parses every section of the text format', () => {
  const qs = parseBankText(sample);
  assert.deepEqual(qs, [
    { id: 'mcq-01', type: 'mcq', prompt: 'Computer science is the study of:', options: ['Computers only', 'Algorithms'], answer: 'B' },
    { id: 'tf-01', type: 'tf', prompt: 'An infinite loop runs forever.', answer: true },
    { id: 'fib-01', type: 'fib', prompt: 'The second generation used ________ instead of vacuum tubes.', answers: ['transistors', 'transistor'] },
    {
      id: 'match-01',
      type: 'matching',
      title: 'Generations',
      pairs: [
        { left: 'First generation', right: 'Vacuum tubes' },
        { left: 'Third generation', right: 'Integrated circuits' },
      ],
    },
  ]);
});

test('reports the line of a missing answer', () => {
  const bad = sample.replace('Answer: B', '');
  assert.throws(() => parseBankText(bad), /line 3: Q1 has no "Answer:" line/);
});

test('rejects a matching answer letter that is not in column B', () => {
  assert.throws(() => parseBankText(sample.replace('2 → A', '2 → C')), /answer letter C is not in column B/);
});

test('rejects a fill-in-the-blank question without a blank', () => {
  assert.throws(() => parseBankText(sample.replace('used ________ instead', 'used instead')), /has no blank/);
});

test('an optional Choices line sets the distractor words of a blank', () => {
  const qs = parseBankText(sample.replace('Answer: transistors | transistor', 'Answer: transistors | transistor\nChoices: relays | gears'));
  const fib = qs.find((q) => q.type === 'fib');
  assert.deepEqual(fib.choices, ['relays', 'gears']);
  assert.equal(fib.prompt, 'The second generation used ________ instead of vacuum tubes.');
});
