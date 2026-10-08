// Study progress kept on the student's device: per-question history, the mistakes list,
// best scores per topic, and which days they practised (for the streak).
// Pure functions over a plain object; app code loads/saves it with readProgress/writeProgress.
//
// A question joins the mistakes list when answered wrong and leaves it after two right answers in a row.

export const PROGRESS_VERSION = 1;
const STORAGE_KEY = 'topgrade.progress.v1';
const KEEP_DAYS = 120;
const CLEARS_MISTAKE = 2;

export const emptyProgress = () => ({ v: PROGRESS_VERSION, topics: {}, days: [], last: null });

/** Local calendar date as YYYY-MM-DD. */
export function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const topicOf = (p, key) => (p.topics[key] ??= { q: {}, runs: 0, best: null, lastScore: null });

/** answers: [{ id, correct }]. Returns a new progress object. */
export function recordAnswers(progress, key, answers, now = Date.now()) {
  const p = structuredClone(progress);
  const t = topicOf(p, key);
  for (const { id, correct } of answers) {
    const s = (t.q[id] ??= { r: 0, w: 0, streak: 0, miss: false });
    if (correct) {
      s.r++;
      s.streak++;
      if (s.miss && s.streak >= CLEARS_MISTAKE) s.miss = false;
    } else {
      s.w++;
      s.streak = 0;
      s.miss = true;
    }
  }
  if (answers.length) {
    const today = dayKey(now);
    if (!p.days.includes(today)) p.days = [...p.days, today].sort().slice(-KEEP_DAYS);
    p.last = { topic: key, at: now };
  }
  return p;
}

/** A finished quiz. Only full topic quizzes count toward the best score (not mistake reviews). */
export function recordRun(progress, key, { percent, counts }, now = Date.now()) {
  const p = structuredClone(progress);
  const t = topicOf(p, key);
  t.runs++;
  t.lastScore = percent;
  if (counts && (t.best === null || percent > t.best)) t.best = percent;
  p.last = { topic: key, at: now };
  return p;
}

/** Progress for one topic. questionIds = the topic's current questions (so removed questions don't count). */
export function topicStats(progress, key, questionIds) {
  const t = progress.topics[key];
  const ids = new Set(questionIds);
  let answered = 0;
  let mastered = 0;
  const mistakes = [];
  for (const id of ids) {
    const s = t?.q[id];
    if (!s) continue;
    answered++;
    if (s.r > 0) mastered++;
    if (s.miss) mistakes.push(id);
  }
  const total = ids.size;
  return { total, answered, mastered, percent: total ? Math.round((mastered / total) * 100) : 0, mistakes, best: t?.best ?? null, runs: t?.runs ?? 0 };
}

/** Totals across everything practised. */
export function overall(progress) {
  let right = 0;
  let wrong = 0;
  let mistakes = 0;
  for (const t of Object.values(progress.topics)) {
    for (const s of Object.values(t.q)) {
      right += s.r;
      wrong += s.w;
      if (s.miss) mistakes++;
    }
  }
  const answered = right + wrong;
  return { answered, accuracy: answered ? Math.round((right / answered) * 100) : null, mistakes };
}

/** Consecutive practice days ending today (or yesterday, so the streak survives until tonight). */
export function streak(progress, now = Date.now()) {
  const days = new Set(progress.days);
  const oneDay = 24 * 60 * 60 * 1000;
  let cursor = now;
  if (!days.has(dayKey(cursor))) cursor -= oneDay;
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n++;
    cursor -= oneDay;
  }
  return n;
}

function isProgress(p) {
  return p && p.v === PROGRESS_VERSION && typeof p.topics === 'object' && p.topics !== null && Array.isArray(p.days);
}

export function readProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return isProgress(p) ? p : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(p) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}
