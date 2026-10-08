#!/usr/bin/env node
// Build step (`npm run build`), run after changing anything in public/:
//  1. index.html: <link rel="modulepreload"> for every app module, so a first visit downloads
//     them in parallel instead of discovering imports one level at a time.
//  2. sw.js: the offline file list and a content version (a new version = installed apps update).
// The tests fail if either is stale, and tg-app-deploy refuses to publish then.
//
//   node tools/build-sw.mjs          update public/index.html and public/sw.js
//   node tools/build-sw.mjs --check  exit 1 if either is out of date

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const SW = join(PUBLIC, 'sw.js');
const INDEX = join(PUBLIC, 'index.html');
// Not needed offline: the worker itself and the link-preview image.
const SKIP = new Set(['sw.js', 'assets/icons/og-image.png']);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.')) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [relative(PUBLIC, full).split(sep).join('/')];
  });
}

export function generated() {
  const files = walk(PUBLIC).filter((f) => !SKIP.has(f)).sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update('\0').update(readFileSync(join(PUBLIC, f)));
  const version = hash.digest('hex').slice(0, 12);
  return `// BEGIN GENERATED\nconst VERSION = '${version}';\nconst FILES = ${JSON.stringify(files, null, 2)};\n// END GENERATED`;
}

const BLOCK = /\/\/ BEGIN GENERATED[\s\S]*?\/\/ END GENERATED/;
const PRELOAD = /<!-- BEGIN MODULEPRELOAD -->[\s\S]*?<!-- END MODULEPRELOAD -->/;

export function preloadBlock() {
  const modules = walk(PUBLIC).filter((f) => f.startsWith('assets/js/') && f.endsWith('.js')).sort();
  return ['<!-- BEGIN MODULEPRELOAD -->', ...modules.map((f) => `<link rel="modulepreload" href="${f}">`), '<!-- END MODULEPRELOAD -->'].join('\n');
}

export function isCurrent() {
  return readFileSync(INDEX, 'utf8').match(PRELOAD)?.[0] === preloadBlock() && readFileSync(SW, 'utf8').match(BLOCK)?.[0] === generated();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) {
    if (!isCurrent()) {
      console.error('public/index.html or public/sw.js is out of date. Run: npm run build');
      process.exit(1);
    }
    console.log('public/index.html and public/sw.js are up to date');
  } else {
    const html = readFileSync(INDEX, 'utf8');
    if (!PRELOAD.test(html)) throw new Error('public/index.html has no MODULEPRELOAD block');
    writeFileSync(INDEX, html.replace(PRELOAD, preloadBlock()));
    const src = readFileSync(SW, 'utf8');
    if (!BLOCK.test(src)) throw new Error('public/sw.js has no GENERATED block');
    writeFileSync(SW, src.replace(BLOCK, generated()));
    console.log(`Updated public/sw.js (${generated().match(/VERSION = '(\w+)'/)[1]})`);
  }
}
