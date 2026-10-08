#!/usr/bin/env node
// Converts a question bank written as plain text into the JSON the quiz page loads.
//
//   node tools/import-bank.mjs <bank.txt> <output.json> [--course-id ID --course-en "..." --course-ar "..."
//                                                       --topic-id ID --topic-number N --topic-title "..."]
//
// When <output.json> already exists its course/topic details are kept and only the questions
// are replaced, so the flags are needed only the first time. The text format is documented
// in README.md ("Question bank format").

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCHEMA_VERSION, validateBank, indexOfLetter } from '../public/assets/js/quiz/bank.js';

const SECTIONS = [
  { type: 'mcq', re: /^\d+\)\s*MCQ\b/i },
  { type: 'tf', re: /^\d+\)\s*True\s*\/\s*False\b/i },
  { type: 'fib', re: /^\d+\)\s*Fill in the Blank\b/i },
  { type: 'matching', re: /^\d+\)\s*Matching\b/i },
];

class ParseError extends Error {
  constructor(line, message) {
    super(`line ${line}: ${message}`);
  }
}

const pad = (n) => String(n).padStart(2, '0');

/** Splits lines into blocks that each start at a line matching `startRe`. */
function blocks(lines, startRe) {
  const out = [];
  for (const l of lines) {
    if (startRe.test(l.text)) out.push({ head: l, body: [] });
    else if (out.length) out[out.length - 1].body.push(l);
    else if (l.text) throw new ParseError(l.no, `unexpected text before the first question: "${l.text}"`);
  }
  return out;
}

function answerLine(block, re, what) {
  const hit = block.body.find((l) => /^Answer\s*:/i.test(l.text));
  if (!hit) throw new ParseError(block.head.no, `${block.head.text} has no "Answer:" line`);
  const m = hit.text.match(re);
  if (!m) throw new ParseError(hit.no, `${what}, got "${hit.text}"`);
  return { m, hit };
}

function promptOf(block, stopRe) {
  const lines = [];
  for (const l of block.body) {
    if (stopRe.test(l.text)) break;
    if (l.text) lines.push(l.text);
  }
  if (!lines.length) throw new ParseError(block.head.no, `${block.head.text} has no question text`);
  return lines.join(' ');
}

function parseMcq(lines) {
  return blocks(lines, /^Q\d+$/).map((b, i) => {
    const prompt = promptOf(b, /^([A-F]\.\s|Answer\s*:)/i);
    const options = [];
    for (const l of b.body) {
      const m = l.text.match(/^([A-F])\.\s+(.+)$/);
      if (!m) continue;
      if (indexOfLetter(m[1]) !== options.length) throw new ParseError(l.no, `expected option ${String.fromCharCode(65 + options.length)}`);
      options.push(m[2].trim());
    }
    const { m } = answerLine(b, /^Answer\s*:\s*([A-F])\s*$/i, 'expected "Answer: <letter>"');
    return { id: `mcq-${pad(i + 1)}`, type: 'mcq', prompt, options, answer: m[1].toUpperCase() };
  });
}

function parseTf(lines) {
  return blocks(lines, /^Q\d+$/).map((b, i) => {
    const prompt = promptOf(b, /^Answer\s*:/i);
    const { m } = answerLine(b, /^Answer\s*:\s*(True|False)\s*$/i, 'expected "Answer: True" or "Answer: False"');
    return { id: `tf-${pad(i + 1)}`, type: 'tf', prompt, answer: m[1].toLowerCase() === 'true' };
  });
}

function parseFib(lines) {
  return blocks(lines, /^Q\d+$/).map((b, i) => {
    const prompt = promptOf(b, /^(Answer|Choices)\s*:/i);
    if (!/_{3,}/.test(prompt)) throw new ParseError(b.head.no, `${b.head.text} has no blank (___) in its text`);
    const { m } = answerLine(b, /^Answer\s*:\s*(.+)$/i, 'expected "Answer: <text>"');
    // "Answer: transistors | transistor" accepts either spelling.
    const answers = m[1].split('|').map((a) => a.trim()).filter(Boolean);
    const question = { id: `fib-${pad(i + 1)}`, type: 'fib', prompt, answers };
    // Optional "Choices: vacuum | magnetic | punched" sets the distractor words shown with the answer.
    const choicesLine = b.body.find((l) => /^Choices\s*:/i.test(l.text));
    if (choicesLine) {
      const choices = choicesLine.text.replace(/^Choices\s*:/i, '').split('|').map((c) => c.trim()).filter(Boolean);
      if (!choices.length) throw new ParseError(choicesLine.no, 'expected "Choices: word | word | word"');
      question.choices = choices;
    }
    return question;
  });
}

function parseMatching(lines) {
  return blocks(lines, /^Matching\s+\d+/i).map((b, i) => {
    const title = b.head.text.replace(/^Matching\s+\d+\s*[—–:-]?\s*/i, '').trim();
    const lefts = new Map();
    const rights = new Map();
    const links = [];
    for (const l of b.body) {
      const row = l.text.match(/^(\d+)\.\s*(.+?)(?:\t+|\s{2,})([A-Z])\.\s*(.+)$/);
      if (row) {
        lefts.set(row[1], row[2].trim());
        rights.set(row[3], row[4].trim());
        continue;
      }
      const link = l.text.match(/^(\d+)\s*(?:→|->|-|=)\s*([A-Z])\s*$/);
      if (link) links.push({ ...l, left: link[1], right: link[2] });
    }
    if (lefts.size < 2) throw new ParseError(b.head.no, `${b.head.text} needs rows like "1. Item<TAB>A. Match"`);
    const pairs = [...lefts.entries()].map(([n, left]) => {
      const link = links.find((k) => k.left === n);
      if (!link) throw new ParseError(b.head.no, `${b.head.text} has no answer for item ${n}`);
      if (!rights.has(link.right)) throw new ParseError(link.no, `answer letter ${link.right} is not in column B`);
      return { left, right: rights.get(link.right) };
    });
    if (new Set(pairs.map((p) => p.right)).size !== rights.size) {
      throw new ParseError(b.head.no, `${b.head.text}: every column-B item must be used exactly once`);
    }
    return { id: `match-${pad(i + 1)}`, type: 'matching', title, pairs };
  });
}

const PARSERS = { mcq: parseMcq, tf: parseTf, fib: parseFib, matching: parseMatching };

/** Parses the text format into a list of questions (throws ParseError with a line number). */
export function parseBankText(text) {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((t, i) => ({ no: i + 1, text: t.replace(/ /g, ' ').trim() }))
    .filter((l) => !/^-{3,}$/.test(l.text) && !/^A\s+B$/.test(l.text) && !/^Answers\s*:$/i.test(l.text));

  const sections = [];
  for (const l of lines) {
    const sec = SECTIONS.find((s) => s.re.test(l.text));
    if (sec) sections.push({ type: sec.type, lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(l);
    else if (l.text) throw new ParseError(l.no, `expected a section heading such as "1) MCQ", got "${l.text}"`);
  }
  if (!sections.length) throw new Error('no sections found');
  return sections.flatMap((s) => PARSERS[s.type](s.lines));
}

function parseArgs(argv) {
  const [input, output, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i]?.startsWith('--') || rest[i + 1] === undefined) throw new Error(`bad argument "${rest[i]}"`);
    flags[rest[i].slice(2)] = rest[i + 1];
  }
  return { input, output, flags };
}

function main() {
  const { input, output, flags } = parseArgs(process.argv.slice(2));
  if (!input || !output) {
    console.error('usage: node tools/import-bank.mjs <bank.txt> <output.json> [--course-id ... --topic-title ...]');
    process.exit(2);
  }
  const previous = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : {};
  const bank = {
    schemaVersion: SCHEMA_VERSION,
    course: {
      id: flags['course-id'] ?? previous.course?.id,
      titleAr: flags['course-ar'] ?? previous.course?.titleAr,
      titleEn: flags['course-en'] ?? previous.course?.titleEn,
    },
    topic: {
      id: flags['topic-id'] ?? previous.topic?.id,
      number: flags['topic-number'] ? Number(flags['topic-number']) : previous.topic?.number,
      title: flags['topic-title'] ?? previous.topic?.title,
    },
    questions: parseBankText(readFileSync(input, 'utf8')),
  };
  const errs = validateBank(bank);
  if (errs.length) {
    console.error(`Bank is invalid:\n  ${errs.join('\n  ')}`);
    process.exit(1);
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(bank, null, 2)}\n`);
  const counts = bank.questions.reduce((acc, q) => ({ ...acc, [q.type]: (acc[q.type] ?? 0) + 1 }), {});
  console.log(`Wrote ${bank.questions.length} questions to ${output}:`, counts);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(`Import failed: ${e.message}`);
    process.exit(1);
  }
}
