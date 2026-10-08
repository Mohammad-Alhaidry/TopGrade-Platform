// Builds a quiz run from a bank and scores it. Pure functions; randomness is injectable for tests.

import { TYPES } from './bank.js';
import { isAnswered, isCorrect, normalizeAnswer } from './grading.js';

export const MODES = ['practice', 'exam'];

// Options like "All of the above" / «جميع ما سبق» only make sense in last position, so they never move.
const PINNED_OPTION = /^((all|none|both|neither) of the (above|options)|(جميع|كل) ما سبق( ذكره)?|لا شيء مما سبق)$/i;

export function shuffle(items, rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Display order for an MCQ's options, as indices into question.options. */
export function optionOrder(question, rng = Math.random) {
  const indices = question.options.map((_, i) => i);
  const pinned = indices.filter((i) => PINNED_OPTION.test(question.options[i].trim()));
  const free = indices.filter((i) => !pinned.includes(i));
  return [...shuffle(free, rng), ...pinned];
}

const WORD_CHOICES = 4;
const casing = (w) => (/^[A-Z0-9]+$/.test(w) ? 'upper' : /^[A-Z]/.test(w) ? 'capital' : 'lower');

/** Gives a distractor the target's capitalisation so case never hints at the answer (acronyms stay as is). */
function matchCase(word, target) {
  if (casing(word) === 'upper') return word;
  if (casing(target) === 'capital') return word[0].toUpperCase() + word.slice(1);
  if (casing(target) === 'lower') return word[0].toLowerCase() + word.slice(1);
  return word;
}

/**
 * Word choices for a fill-in-the-blank question: its answer plus distractors, shuffled.
 * Uses the question's own `choices` when the bank provides them; otherwise draws from the
 * other blanks' answers in the same bank (pool), preferring words with the same capitalisation.
 */
export function blankChoices(question, pool, rng = Math.random, size = WORD_CHOICES) {
  const answer = question.answers[0];
  const taken = new Set(question.answers.map(normalizeAnswer));
  const seen = new Set();
  const unique = (words) => words.filter((w) => {
    const k = normalizeAnswer(w);
    if (taken.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (question.choices) return shuffle([answer, ...unique(question.choices)], rng);
  const candidates = unique(pool);
  const same = shuffle(candidates.filter((w) => casing(w) === casing(answer)), rng);
  const other = shuffle(candidates.filter((w) => casing(w) !== casing(answer)), rng);
  const distractors = [...same, ...other].slice(0, size - 1).map((w) => matchCase(w, answer));
  return shuffle([answer, ...distractors], rng);
}

/**
 * @param bank      validated question bank
 * @param types     question types to include (subset of TYPES)
 * @param count     number of questions, or null for all matching questions
 * @param mode      'practice' | 'exam'
 * @param ids       optional explicit question ids (used for "retry incorrect")
 */
export function createSession(bank, { types = TYPES, count = null, mode = 'practice', ids = null, rng = Math.random } = {}) {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode "${mode}"`);
  const pool = bank.questions.filter((q) => (ids ? ids.includes(q.id) : types.includes(q.type)));
  if (pool.length === 0) throw new Error('No questions match this selection');

  const picked = shuffle(pool, rng).slice(0, count ?? pool.length);
  const blankPool = bank.questions.filter((q) => q.type === 'fib').map((q) => q.answers[0]);
  const items = picked.map((question) => ({
    question,
    // Per-run display order; grading never depends on it.
    optionOrder: question.type === 'mcq' ? optionOrder(question, rng) : null,
    choiceOrder: question.type === 'matching' ? shuffle(question.pairs.map((p) => p.right), rng) : null,
    wordChoices: question.type === 'fib' ? blankChoices(question, blankPool, rng) : null,
  }));
  return { mode, items, responses: items.map(() => undefined) };
}

export function summarize(session) {
  const byType = {};
  let correct = 0;
  let answered = 0;
  const results = session.items.map((item, i) => {
    const response = session.responses[i];
    const ok = isCorrect(item.question, response);
    const done = isAnswered(item.question, response);
    if (ok) correct++;
    if (done) answered++;
    const t = (byType[item.question.type] ??= { correct: 0, total: 0 });
    t.total++;
    if (ok) t.correct++;
    return { item, response, correct: ok, answered: done };
  });
  const total = session.items.length;
  return { total, correct, answered, percent: Math.round((correct / total) * 100), byType, results };
}
