// Answer checking. Responses are always expressed in bank terms (never display order),
// so shuffling options on screen can't affect grading:
//   mcq      -> option index in question.options
//   tf       -> true | false
//   fib      -> the typed string
//   matching -> array where response[i] is the right-hand text chosen for pairs[i].left

import { indexOfLetter } from './bank.js';

/** Case-, space- and punctuation-insensitive form used to compare typed answers. */
export function normalizeAnswer(text) {
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[.,;:!?"]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isAnswered(question, response) {
  if (response === undefined || response === null) return false;
  if (question.type === 'fib') return normalizeAnswer(response) !== '';
  if (question.type === 'matching') {
    return Array.isArray(response) && question.pairs.every((_, i) => typeof response[i] === 'string' && response[i] !== '');
  }
  return true;
}

/** For matching questions: which pairs were matched correctly, in pair order. */
export function matchingResults(question, response) {
  return question.pairs.map((p, i) => Array.isArray(response) && response[i] === p.right);
}

export function isCorrect(question, response) {
  if (!isAnswered(question, response)) return false;
  switch (question.type) {
    case 'mcq':
      return response === indexOfLetter(question.answer);
    case 'tf':
      return response === question.answer;
    case 'fib': {
      const given = normalizeAnswer(response);
      return question.answers.some((a) => normalizeAnswer(a) === given);
    }
    case 'matching':
      return matchingResults(question, response).every(Boolean);
    default:
      return false;
  }
}

/** Correct answer as display text, for feedback and the review list. */
export function correctAnswerText(question) {
  switch (question.type) {
    case 'mcq':
      return question.options[indexOfLetter(question.answer)];
    case 'tf':
      return question.answer ? 'True' : 'False';
    case 'fib':
      return question.answers[0];
    case 'matching':
      return question.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    default:
      return '';
  }
}

/** The student's response as display text (null when unanswered). */
export function responseText(question, response) {
  if (!isAnswered(question, response)) return null;
  switch (question.type) {
    case 'mcq':
      return question.options[response];
    case 'tf':
      return response ? 'True' : 'False';
    case 'fib':
      return String(response).trim();
    case 'matching':
      return question.pairs.map((p, i) => `${p.left} → ${response[i]}`).join('\n');
    default:
      return null;
  }
}
