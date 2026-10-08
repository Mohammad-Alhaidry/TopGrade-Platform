// Question bank format and validation. Shared by the browser and tools/import-bank.mjs,
// so a bank that imports cleanly is guaranteed to load in the quiz page.
//
// Bank shape:
//   { schemaVersion: 1,
//     course: { id, titleAr, titleEn },
//     topic:  { id, number, title },
//     questions: [Question] }
//
// Question shapes (explanation and source are optional on every type):
//   { id, type: 'mcq',      prompt, options: [string x2..6], answer: 'A'..'F' }
//   { id, type: 'tf',       prompt, answer: true | false }
//   { id, type: 'fib',      prompt, answers: [string, ...], choices?: [string, ...] }
//        any listed answer is accepted; choices are optional distractor words (otherwise drawn from other blanks)
//   { id, type: 'matching', title, pairs: [{ left, right } x2..] }
//   explanation: string, source: { page: number | string },
//   image: { src: 'course/img/name.svg', alt } (a figure the question needs; src is relative to data/)

export const SCHEMA_VERSION = 1;
export const TYPES = ['mcq', 'tf', 'fib', 'matching'];
export const TYPE_LABELS = { mcq: 'MCQ', tf: 'True / False', fib: 'Fill in the Blank', matching: 'Matching' };

export const letterOf = (index) => String.fromCharCode(65 + index);
export const indexOfLetter = (letter) => letter.charCodeAt(0) - 65;

const isText = (v) => typeof v === 'string' && v.trim() !== '';

function questionErrors(q) {
  const errs = [];
  if (!isText(q.id)) errs.push('missing id');
  if (!TYPES.includes(q.type)) return [...errs, `unknown type "${q.type}"`];

  if (q.type === 'matching') {
    if (!isText(q.title)) errs.push('missing title');
    if (!Array.isArray(q.pairs) || q.pairs.length < 2) errs.push('needs at least 2 pairs');
    else {
      q.pairs.forEach((p, i) => {
        if (!isText(p?.left) || !isText(p?.right)) errs.push(`pair ${i + 1} needs left and right`);
      });
      const rights = q.pairs.map((p) => p?.right);
      if (new Set(rights).size !== rights.length) errs.push('pair right-hand texts must be unique');
    }
  } else if (!isText(q.prompt)) {
    errs.push('missing prompt');
  }

  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 || !q.options.every(isText)) {
      errs.push('options must be 2-6 non-empty strings');
    } else if (typeof q.answer !== 'string' || !/^[A-F]$/.test(q.answer) || indexOfLetter(q.answer) >= q.options.length) {
      errs.push(`answer must be a letter A-${letterOf(q.options.length - 1)}`);
    }
  }
  if (q.type === 'tf' && typeof q.answer !== 'boolean') errs.push('answer must be true or false');
  if (q.type === 'fib' && (!Array.isArray(q.answers) || q.answers.length === 0 || !q.answers.every(isText))) {
    errs.push('answers must be a non-empty list of strings');
  }
  if (q.type === 'fib' && q.choices !== undefined && (!Array.isArray(q.choices) || q.choices.length === 0 || !q.choices.every(isText))) {
    errs.push('choices must be a non-empty list of strings');
  }

  if (q.explanation !== undefined && !isText(q.explanation)) errs.push('explanation must be text');
  if (q.image !== undefined && !(/^[a-z0-9-]+\/img\/[a-z0-9-]+\.(svg|png|webp|jpg)$/.test(q.image?.src ?? '') && isText(q.image?.alt))) {
    errs.push('image needs src like "course/img/name.svg" and alt text');
  }
  if (q.source !== undefined && !(typeof q.source?.page === 'number' || isText(q.source?.page))) {
    errs.push('source.page must be a number or text');
  }
  return errs;
}

/** Returns a list of human-readable problems; empty means the bank is valid. */
export function validateBank(bank) {
  const errs = [];
  if (bank?.schemaVersion !== SCHEMA_VERSION) errs.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!isText(bank?.course?.id) || !isText(bank?.course?.titleEn)) errs.push('course needs id and titleEn');
  if (!isText(bank?.topic?.id) || !isText(bank?.topic?.title)) errs.push('topic needs id and title');
  if (!Array.isArray(bank?.questions) || bank.questions.length === 0) return [...errs, 'questions must be a non-empty list'];

  const seen = new Set();
  bank.questions.forEach((q, i) => {
    const label = `question ${i + 1}${isText(q?.id) ? ` (${q.id})` : ''}`;
    if (isText(q?.id)) {
      if (seen.has(q.id)) errs.push(`${label}: duplicate id`);
      seen.add(q.id);
    }
    for (const e of questionErrors(q ?? {})) errs.push(`${label}: ${e}`);
  });
  return errs;
}

export async function loadBank(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load questions (HTTP ${res.status})`);
  const bank = await res.json();
  const errs = validateBank(bank);
  if (errs.length) throw new Error(`Question bank is invalid:\n${errs.join('\n')}`);
  return bank;
}
