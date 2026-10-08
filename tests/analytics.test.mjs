import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {};
const { track, describeSession } = await import('../public/assets/js/app/analytics.js');

test('events raised before the tracker loads are queued, then sent in order', () => {
  track('quiz_start', { mode: 'exam' });
  describeSession({ language: 'ar' });
  const sent = [];
  window.umami = { track: (n, d) => sent.push(['track', n, d]), identify: (d) => sent.push(['identify', d]) };
  track('quiz_finish', { score: 80 });
  assert.deepEqual(sent, [
    ['track', 'quiz_start', { mode: 'exam' }],
    ['identify', { language: 'ar' }],
    ['track', 'quiz_finish', { score: 80 }],
  ]);
});

test('a failing tracker never throws into the app', () => {
  window.umami = { track: () => { throw new Error('blocked'); } };
  assert.doesNotThrow(() => track('answer_wrong', { question: 'mcq-01' }));
});
