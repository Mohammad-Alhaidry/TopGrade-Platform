#!/usr/bin/env node
// Copies the course list of the Telegram channel «تسريبات وتجميعات جامعة الملك خالد» (@ExamLeaks_KKU) into
// public/data/kku.json for the /kku page: each college with its courses, each course with its post in the channel
// and how many files that post leads to; and, for Smart Pro's courses the channel also has, their post.
// The page also links the owner's channel «قناة جامعة الملك خالد» (@Kku_One).
// The source is the leaks bot's catalog (/root/kku-system/tools/leaks_catalog.py makes it). Rerun after it changes,
// then `npm run build`:
//   node tools/import-kku.mjs [/root/kku-system/catalog/leaks.json]
// Book names are written in Arabic on the page (no English on the Arabic screens); the English stays in `en`.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = process.argv[2] ?? '/root/kku-system/catalog/leaks.json';
const OUT = fileURLToPath(new URL('../public/data/kku.json', import.meta.url));
const CATALOG = fileURLToPath(new URL('../public/data/catalog.json', import.meta.url));

// The bot's college names -> an id for the page and the English interface's name.
const COLLEGES = {
  'الكلية التطبيقية': ['applied', 'Applied College'],
  'كلية الأعمال': ['business', 'College of Business'],
  'كلية علوم الحاسب': ['computing', 'College of Computer Science'],
  'الكليات الصحية': ['health', 'Health Colleges'],
  'كلية العلوم': ['science', 'College of Science'],
  'كلية الهندسة': ['engineering', 'College of Engineering'],
  'اللغة الإنجليزية': ['english', 'English'],
  'مقررات أخرى': ['other', 'Other courses'],
};
// Smart Pro's course -> the same course's name in the channel.
const SMART_PRO = {
  'problem-solving': 'حل المشاكل والبرمجة',
  'principles-of-accounting-1': 'مبادئ المحاسبة 1',
  'calculus-1': 'التفاضل والتكامل 1',
  'business-math': 'رياضيات الأعمال',
};
const ARABIC = [[/^Evolve (\d)$/, 'إيفولف $1'], [/^Unlock (\d)$/, 'أنلوك $1']];

const cat = JSON.parse(readFileSync(SRC, 'utf8'));
const smartProIds = new Set(JSON.parse(readFileSync(CATALOG, 'utf8')).courses.map((c) => c.id));

function course(slug) {
  const c = cat.courses[slug];
  const rule = ARABIC.find(([re]) => re.test(c.title));
  return { title: rule ? c.title.replace(rule[0], rule[1]) : c.title, ...(rule ? { en: c.title } : {}), post: c.posts[0], files: c.files };
}
// Book courses first, by their English name (Evolve 1…4, then Unlock); the rest in Arabic order.
const order = (a, b) => (Number(!!b.en) - Number(!!a.en)) || (a.en && b.en ? a.en.localeCompare(b.en) : a.title.localeCompare(b.title, 'ar'));

const colleges = cat.colleges.map((col) => {
  if (!COLLEGES[col.name]) throw new Error(`no id for the college «${col.name}»`);
  const [id, en] = COLLEGES[col.name];
  const slugs = new Set([...col.majors.flatMap((m) => [...Object.values(m.levels).flat(), ...m.electives]), ...col.other]);
  return { id, name: col.name, en, courses: [...slugs].map(course).sort(order) };
}).filter((col) => col.courses.length);

const byTitle = new Map(Object.values(cat.courses).map((c) => [c.title, c.posts[0]]));
const smartpro = {};
for (const [id, title] of Object.entries(SMART_PRO)) {
  if (!smartProIds.has(id)) throw new Error(`Smart Pro has no course «${id}»`);
  if (!byTitle.has(title)) throw new Error(`the channel has no course «${title}»`);
  smartpro[id] = byTitle.get(title);
}

const out = { channel: cat.channel, bot: 'KingKhalidLeaks_bot', uni: 'Kku_One', total: Object.keys(cat.courses).length, colleges, smartpro };
writeFileSync(OUT, `${JSON.stringify(out)}\n`);
console.log(`${out.total} courses in ${colleges.length} colleges, ${Object.keys(smartpro).length} shared with Smart Pro -> public/data/kku.json`);
