#!/usr/bin/env node
// Build step (first in `npm run build`): a catalog topic with "mix" (e.g. a practice midterm across chapters)
// gets a bank made of its source topics' questions, written to the topic's own bank file. Questions keep their
// ids (they must be unique across the sources), explanations and page references.
//
//   node tools/build-mixed.mjs          write the mixed banks
//   node tools/build-mixed.mjs --check  exit 1 if any is out of date

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DATA = fileURLToPath(new URL('../public/data/', import.meta.url));
const read = (rel) => JSON.parse(readFileSync(join(DATA, rel), 'utf8'));

/** { 'course/topic.json': file contents } for every mixed topic. */
export function generated() {
  const out = {};
  for (const course of read('catalog.json').courses) {
    for (const topic of course.topics.filter((t) => t.mix)) {
      const sources = topic.mix.map((id) => read(course.topics.find((t) => t.id === id).bank));
      const questions = sources.flatMap((b) => b.questions);
      const ids = questions.map((q) => q.id);
      const dup = ids.find((id, i) => ids.indexOf(id) !== i);
      if (dup) throw new Error(`${topic.bank}: question id "${dup}" appears in more than one source topic`);
      const bank = { schemaVersion: 1, course: sources[0].course, topic: { id: topic.id, number: topic.number, title: topic.title }, questions };
      out[topic.bank] = `${JSON.stringify(bank, null, 2)}\n`;
    }
  }
  return out;
}

export function isCurrent() {
  return Object.entries(generated()).every(([f, body]) => existsSync(join(DATA, f)) && readFileSync(join(DATA, f), 'utf8') === body);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) {
    if (!isCurrent()) {
      console.error('A mixed topic bank (e.g. the practice midterm) is out of date. Run: npm run build');
      process.exit(1);
    }
  } else {
    const files = generated();
    for (const [f, body] of Object.entries(files)) writeFileSync(join(DATA, f), body);
    console.log(`Wrote ${Object.keys(files).length} mixed bank(s)`);
  }
}
