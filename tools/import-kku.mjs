#!/usr/bin/env node
// Copies the course list of the Telegram channel «تسريبات وتجميعات جامعة الملك خالد» (@ExamLeaks_KKU) into
// public/data/kku.json for the /kku page: each college with its courses, each course with its post in the channel
// and how many files that post leads to; and, for Smart Pro's courses the channel also has, their post.
// The page also links the owner's channel «قناة جامعة الملك خالد» (@Kku_One), and ends with the owner's Telegram
// channels, bots and groups (TELEGRAM below): adding one is a line there, then this tool and `npm run build`.
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

// The owner's Telegram channels, bots and groups, listed at the end of the page (each a link with a line saying
// what it is, from the chat's own description). Arabic only on the Arabic screen; `en`/`enSub` for the English one.
const TELEGRAM = {
  channels: [
    { handle: 'ExamLeaks_KKU', title: 'تسريبات وتجميعات جامعة الملك خالد', sub: 'ملفات المقررات: اختبارات سابقة وملخصات وبنوك أسئلة، مرتبة حسب الكلية',
      en: 'KKU leaks and collections', enSub: 'Course files: past exams, summaries and question banks, by college' },
    { handle: 'Kku_One', title: 'قناة جامعة الملك خالد', sub: 'أخبار الجامعة ومواعيد القبول والتسجيل والتقويم الجامعي',
      en: 'King Khalid University channel', enSub: 'University news, admission and registration dates, the academic calendar' },
    { handle: 'KkU_LiNkS1', title: 'روابط قروبات الشعب', sub: 'روابط قروبات الشعب لكل التخصصات',
      en: 'Section group links', enSub: 'Links to the section groups of every major' },
    { handle: 'UnLoCk3RdBest', title: 'أنلوك 1|2|3', sub: 'كتب أنلوك الإصدار الثالث: كتاب الطالب والحلول وكتاب المعلم والصوتيات',
      en: 'Unlock 1|2|3', enSub: 'Unlock third edition: student’s books, answer keys, teacher’s books and audio' },
    { handle: 'EnglishEvolove1234', title: 'إيفولف 1|2|3|4', sub: 'كتب إيفولف: كتاب الطالب وكتاب النشاط والحلول وملفات الوحدات',
      en: 'Evolve 1|2|3|4', enSub: 'Evolve: student’s books, workbooks, answer keys and unit files' },
  ],
  bots: [
    { handle: 'KingKhalidLeaks_bot', title: 'بوت التسريبات والتجميعات', sub: 'اختر كليتك وتخصصك ومستواك وتوصلك ملفات مقرراتك',
      en: 'Leaks and collections bot', enSub: 'Choose your college, major and level and get your courses’ files' },
    { handle: 'KKU_One_Bot', title: 'بوت الدليل', sub: 'اختر كليتك ويفتح لك بوتها، أو ابحث عن أي مقرر في كل الكليات',
      en: 'Guide bot', enSub: 'Pick your college to open its bot, or search any course across the colleges' },
    { handle: 'KKU_Health_Bot', title: 'بوت المسار الصحي', sub: 'مقررات الكليات الصحية وملفاتها، مرتبة حسب التخصص والترم',
      en: 'Health track bot', enSub: 'The health colleges’ courses and files, by major and term' },
    { handle: 'KKU_Engineering_Bot', title: 'بوت الهندسة', sub: 'مقررات كلية الهندسة وملفاتها، مرتبة حسب التخصص والترم',
      en: 'Engineering bot', enSub: 'The College of Engineering’s courses and files, by major and term' },
    { handle: 'KKU_CS_Bot', title: 'بوت الحاسب', sub: 'مقررات كلية علوم الحاسب وملفاتها، مرتبة حسب التخصص والترم',
      en: 'Computer science bot', enSub: 'The College of Computer Science’s courses and files, by major and term' },
    { handle: 'KKU_Business_Bot', title: 'بوت الأعمال', sub: 'مقررات كلية الأعمال وملفاتها، مرتبة حسب التخصص والترم',
      en: 'Business bot', enSub: 'The College of Business’s courses and files, by major and term' },
    { handle: 'KKU_Science_Bot', title: 'بوت العلوم', sub: 'مقررات كلية العلوم وملفاتها، مرتبة حسب التخصص والترم',
      en: 'Science bot', enSub: 'The College of Science’s courses and files, by major and term' },
    { handle: 'EnglishEvolve1234Bot', title: 'بوت إيفولف', sub: 'ملفات إيفولف مرتبة حسب المستوى',
      en: 'Evolve bot', enSub: 'Evolve files by level' },
    { handle: 'UnLoCk123BeStBot', title: 'بوت أنلوك', sub: 'كتب أنلوك 1|2|3 وحلولها وصوتياتها',
      en: 'Unlock bot', enSub: 'Unlock 1|2|3 books, answer keys and audio' },
  ],
  groups: [
    { handle: 'TalkKKU', title: 'مناقشة جامعة الملك خالد', sub: 'القروب العام: نقاش واستفسارات وملخصات وأخبار الكليات والجداول',
      en: 'KKU discussion', enSub: 'The general group: discussion, questions, summaries, college news and timetables' },
    { handle: 'KkuGirls', title: 'بنات جامعة الملك خالد', sub: 'قروب البنات: المقررات والاستفسارات والأخبار الجامعية',
      en: 'KKU girls', enSub: 'The girls’ group: courses, questions and university news' },
    { handle: 'Kku_Diploma', title: 'دبلوم جامعة الملك خالد', sub: 'قروب الدبلوم: المقررات والمواد التعليمية والاستفسارات',
      en: 'KKU diploma', enSub: 'The diploma group: courses, study material and questions' },
    { handle: 'Kku_medics', title: 'التخصصات الصحية', sub: 'قروب التخصصات الصحية: المقررات والمصادر والاستفسارات',
      en: 'Health majors', enSub: 'The health majors’ group: courses, resources and questions' },
    { handle: 'KKU_SCI', title: 'كلية العلوم', sub: 'قروب كلية العلوم: المقررات والموارد والاستفسارات',
      en: 'College of Science', enSub: 'The College of Science group: courses, resources and questions' },
    { handle: 'KKU_CS', title: 'كلية علوم الحاسب', sub: 'قروب كلية علوم الحاسب: المقررات والموارد والاستفسارات',
      en: 'College of Computer Science', enSub: 'The College of Computer Science group: courses, resources and questions' },
    { handle: 'KKU_BIZ', title: 'كلية الأعمال', sub: 'قروب كلية الأعمال: المقررات والاستفسارات وأخبار الكلية',
      en: 'College of Business', enSub: 'The College of Business group: courses, questions and college news' },
    { handle: 'ENG_KKU', title: 'انجليزي مكثف', sub: 'قروب الإنجليزي المكثف: موضوعات المقرر والاستفسارات',
      en: 'Intensive English', enSub: 'The intensive English group: the course’s topics and questions' },
    { handle: 'UnLoCk3Rd_Discussion', title: 'نقاش أنلوك', sub: 'قروب نقاش قناة أنلوك 1|2|3',
      en: 'Unlock discussion', enSub: 'The discussion group of the Unlock 1|2|3 channel' },
  ],
};

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

const out = { channel: cat.channel, bot: 'KingKhalidLeaks_bot', uni: 'Kku_One', total: Object.keys(cat.courses).length, colleges, telegram: TELEGRAM, smartpro };
writeFileSync(OUT, `${JSON.stringify(out)}\n`);
console.log(`${out.total} courses in ${colleges.length} colleges, ${Object.keys(smartpro).length} shared with Smart Pro -> public/data/kku.json`);
