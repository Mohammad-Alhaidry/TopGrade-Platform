// Saves an unfinished quiz so a refresh or a closed tab can be resumed on the same device.
// Only question ids and per-run display orders are stored; questions are re-read from the bank,
// and a saved run whose questions no longer match the bank is discarded.

import { normalizeAnswer } from './grading.js';

export const STORE_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const bankKey = (bank) => `${bank.course.id}/${bank.topic.id}`;

/** Which bank a saved run belongs to ("course/topic"), without needing the bank loaded. */
export const savedBankKey = (data) => (data?.v === STORE_VERSION && typeof data.bank === 'string' ? data.bank : null);

export function serializeRun(bank, run) {
  return {
    v: STORE_VERSION,
    bank: bankKey(bank),
    mode: run.session.mode,
    kind: run.kind ?? 'topic',
    items: run.session.items.map((it) => ({ id: it.question.id, o: it.optionOrder, c: it.choiceOrder, w: it.wordChoices })),
    responses: run.session.responses.map((r) => (r === undefined ? null : r)),
    checked: run.checked,
    index: run.index,
    startedAt: run.startedAt,
    savedAt: Date.now(),
  };
}

const isPermutation = (order, size) =>
  Array.isArray(order) && order.length === size && [...order].sort((a, b) => a - b).every((v, i) => v === i);

/** Rebuilds a run from saved data, or returns null when it is stale, foreign or inconsistent. */
export function deserializeRun(bank, data, now = Date.now()) {
  if (!data || data.v !== STORE_VERSION || data.bank !== bankKey(bank)) return null;
  if (typeof data.savedAt !== 'number' || now - data.savedAt > MAX_AGE_MS) return null;
  if (!['practice', 'exam'].includes(data.mode) || !Array.isArray(data.items) || data.items.length === 0) return null;
  if (!Array.isArray(data.responses) || data.responses.length !== data.items.length) return null;

  const byId = new Map(bank.questions.map((q) => [q.id, q]));
  const items = [];
  for (const saved of data.items) {
    const question = byId.get(saved?.id);
    if (!question) return null;
    if (question.type === 'mcq' && !isPermutation(saved.o, question.options.length)) return null;
    if (question.type === 'matching') {
      const rights = question.pairs.map((p) => p.right).sort();
      if (!Array.isArray(saved.c) || [...saved.c].sort().join('\u0000') !== rights.join('\u0000')) return null;
    }
    if (question.type === 'fib') {
      const answers = new Set(question.answers.map(normalizeAnswer));
      if (!Array.isArray(saved.w) || !saved.w.every((w) => typeof w === 'string') || !saved.w.some((w) => answers.has(normalizeAnswer(w)))) return null;
    }
    items.push({
      question,
      optionOrder: question.type === 'mcq' ? saved.o : null,
      choiceOrder: question.type === 'matching' ? saved.c : null,
      wordChoices: question.type === 'fib' ? saved.w : null,
    });
  }

  const index = Number.isInteger(data.index) && data.index >= 0 && data.index < items.length ? data.index : 0;
  const checked = items.map((_, i) => data.mode === 'practice' && Array.isArray(data.checked) && data.checked[i] === true);
  return {
    kind: data.kind === 'mistakes' ? 'mistakes' : 'topic',
    session: { mode: data.mode, items, responses: data.responses.map((r) => (r === null ? undefined : r)) },
    index,
    checked,
    startedAt: typeof data.startedAt === 'number' ? data.startedAt : now,
    finishedAt: null,
  };
}
