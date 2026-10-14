// Math line wrapping (app/math.js texPieces): every piece a formula is cut into must still render, otherwise the
// phone shows raw TeX. Checked on the known shapes and on every formula of every math course's banks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { texPieces } from '../public/assets/js/app/math.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const ctx = {};
runInNewContext(readFileSync(`${PUBLIC}assets/vendor/temml/temml.min.js`, 'utf8') + ';globalThis.temml=temml;', ctx);
const renders = (tex) => { try { ctx.temml.renderToString(`\\displaystyle ${tex}`, { throwOnError: true }); return true; } catch { return false; } };

test('a union of intervals written with \\left and \\right breaks before \\cup, never inside a bracket pair', () => {
  assert.deepEqual(texPieces('\\left(-\\infty, -\\frac{4}{3}\\right] \\cup \\left[\\frac{4}{3}, \\infty\\right)'),
    ['\\left(-\\infty, -\\frac{4}{3}\\right]', '\\cup \\left[\\frac{4}{3}, \\infty\\right)']);
  assert.deepEqual(texPieces('(-\\infty, 0] \\cup \\left[\\frac{2}{3}, \\infty\\right)'), ['(-\\infty, 0]', '\\cup \\left[\\frac{2}{3}, \\infty\\right)']);
  assert.deepEqual(texPieces('\\left(-\\infty,-\\frac{12}{5}\\right]\\cup[2,+\\infty)'), ['\\left(-\\infty,-\\frac{12}{5}\\right]', '\\cup[2,+\\infty)']);
});

test('a formula wrapped whole in one pair of brackets may still break inside them', () => {
  const pieces = texPieces('(a = 1, b = 2, c = 3, d = 4, e = 5, f = 6, g = 7, h = 8)');
  assert.ok(pieces.length > 1);
  assert.ok(pieces[0].startsWith('(') && pieces.at(-1).endsWith(')'));
  assert.ok(pieces.every(renders));
});

test('short formulas stay whole', () => {
  assert.deepEqual(texPieces('[2, 3]'), ['[2, 3]']);
});

test('every formula in every math course renders after wrapping', () => {
  const catalog = JSON.parse(readFileSync(`${PUBLIC}data/catalog.json`, 'utf8'));
  const broken = [];
  let formulas = 0;
  for (const course of catalog.courses.filter((c) => c.math)) {
    for (const topic of course.topics.filter((t) => !t.mix)) {
      for (const q of JSON.parse(readFileSync(`${PUBLIC}data/${topic.bank}`, 'utf8')).questions) {
        const texts = [q.prompt, q.title, q.explanation, ...(q.options ?? []), ...(q.pairs ?? []).map((p) => p.left)].filter(Boolean);
        for (const t of texts) for (const m of t.matchAll(/\\\((.+?)\\\)/gs)) {
          formulas++;
          for (const piece of texPieces(m[1])) if (!renders(piece)) broken.push(`${q.id}: "${piece}" of "${m[1]}"`);
        }
      }
    }
  }
  assert.ok(formulas > 1000, `only ${formulas} formulas found`);
  assert.deepEqual(broken, []);
});
