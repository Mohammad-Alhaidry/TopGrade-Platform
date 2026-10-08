// Course catalog: which courses exist, their topics, and where each topic's question bank lives.
//
// data/catalog.json:
//   { schemaVersion: 1,
//     courses: [{ id, titleEn, titleAr, lang?, topics: [{ id, number, title, bank: 'course/topic.json',
//                                                     label?, mix?, defaults? }] }] }
//   lang:     language of the course content (questions, topic titles): 'en' (default) or 'ar' (right to left).
//   label:    { en, ar } shown instead of "Topic N", e.g. { en: 'Chapter 1', ar: 'الفصل الأول' }.
//   mix:      ids of other topics in the course; tools/build-mixed.mjs writes this topic's bank from theirs
//             (a practice midterm across chapters).
//   defaults: { mode: 'practice' | 'exam', count: 10 | 20 | 40 | null } preselected on the topic's setup screen.
//
// Adding a course or topic = adding its bank file and an entry here; no code changes.

import { loadBank } from '../quiz/bank.js';
import { t } from './i18n.js';

export const CATALOG_VERSION = 1;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isText = (v) => typeof v === 'string' && v.trim() !== '';
export const SETUP_COUNTS = [10, 20, 40, null];

/** Language of a course's content: questions and topic titles. */
export const contentLang = (course) => (course?.lang === 'ar' ? 'ar' : 'en');

/** "Topic 2", or the topic's own label such as "الفصل الأول" or "Homework". */
export const topicLabel = (topic, language) => topic.label?.[language] ?? t('topicN', { n: topic.number }, language);

/** Returns a list of problems; empty means the catalog is valid. */
export function validateCatalog(catalog) {
  const errs = [];
  if (catalog?.schemaVersion !== CATALOG_VERSION) errs.push(`schemaVersion must be ${CATALOG_VERSION}`);
  if (!Array.isArray(catalog?.courses) || catalog.courses.length === 0) return [...errs, 'courses must be a non-empty list'];
  const courseIds = new Set();
  catalog.courses.forEach((c, i) => {
    const label = `course ${i + 1}${isText(c?.id) ? ` (${c.id})` : ''}`;
    if (!isText(c?.id) || !SLUG.test(c.id)) errs.push(`${label}: id must be lowercase-with-dashes`);
    else if (courseIds.has(c.id)) errs.push(`${label}: duplicate id`);
    courseIds.add(c?.id);
    if (!isText(c?.titleEn)) errs.push(`${label}: missing titleEn`);
    if (c?.titleAr !== undefined && !isText(c.titleAr)) errs.push(`${label}: titleAr must be text`);
    if (c?.lang !== undefined && !['en', 'ar'].includes(c.lang)) errs.push(`${label}: lang must be "en" or "ar"`);
    if (!Array.isArray(c?.topics) || c.topics.length === 0) {
      errs.push(`${label}: topics must be a non-empty list`);
      return;
    }
    const topicIds = new Set();
    c.topics.forEach((t, j) => {
      const tl = `${label} topic ${j + 1}`;
      if (!isText(t?.id) || !SLUG.test(t.id)) errs.push(`${tl}: id must be lowercase-with-dashes`);
      else if (topicIds.has(t.id)) errs.push(`${tl}: duplicate id`);
      topicIds.add(t?.id);
      if (!Number.isInteger(t?.number) || t.number < 1) errs.push(`${tl}: number must be a positive integer`);
      if (!isText(t?.title)) errs.push(`${tl}: missing title`);
      if (!isText(t?.bank) || !/^[a-z0-9-]+\/[a-z0-9-]+\.json$/.test(t.bank)) errs.push(`${tl}: bank must look like "course/topic.json"`);
      if (t?.label !== undefined && !(isText(t.label?.en) && isText(t.label?.ar))) errs.push(`${tl}: label needs en and ar`);
      if (t?.defaults !== undefined && (!['practice', 'exam', undefined].includes(t.defaults?.mode) || !SETUP_COUNTS.includes(t.defaults?.count ?? 20))) {
        errs.push(`${tl}: defaults need mode practice|exam and count 10|20|40|null`);
      }
      if (t?.mix !== undefined) {
        const others = c.topics.filter((o) => o !== t && !o.mix).map((o) => o.id);
        if (!Array.isArray(t.mix) || t.mix.length === 0 || !t.mix.every((id) => others.includes(id))) errs.push(`${tl}: mix must list other (non-mixed) topic ids of the course`);
      }
    });
  });
  return errs;
}

export const topicKey = (course, topic) => `${course.id}/${topic.id}`;

export function findCourse(catalog, courseId) {
  return catalog.courses.find((c) => c.id === courseId) ?? null;
}

export function findTopic(catalog, courseId, topicId) {
  const course = findCourse(catalog, courseId);
  const topic = course?.topics.find((t) => t.id === topicId) ?? null;
  return course && topic ? { course, topic } : null;
}

export async function loadCatalog(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load courses (HTTP ${res.status})`);
  const catalog = await res.json();
  const errs = validateCatalog(catalog);
  if (errs.length) throw new Error(`Course catalog is invalid:\n${errs.join('\n')}`);
  return catalog;
}

// Banks are fetched once per page load and shared by every screen.
const banks = new Map();
export function loadTopicBank(dataUrl, topic) {
  if (!banks.has(topic.bank)) {
    const p = loadBank(new URL(topic.bank, dataUrl).href);
    p.catch(() => banks.delete(topic.bank)); // let a later visit retry after a network failure
    banks.set(topic.bank, p);
  }
  return banks.get(topic.bank);
}
