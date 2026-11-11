# The owner's Telegram channels, bots and groups on /kku: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A section «جامعة الملك خالد على تيليجرام» at the end of Smart Pro's `/kku` page listing the owner's 5 channels, 9 bots and 9 groups, each a link with a line saying what it is, in the app and in the page search engines read.

**Architecture:** The list is a constant in `tools/import-kku.mjs`, written into `public/data/kku.json` as `telegram`. The view (`views/kku.js`) adds three closed `<details>` cards after the colleges, reusing the college-card markup; `tools/build-pages.mjs` adds the same list as headings and links to the prerendered page. No new URL.

**Tech Stack:** Plain ES modules (no bundler), `node --test`, `npm run build`.

## Global Constraints

- Every interface string in English and Arabic (`i18n.js`; a test enforces it); Arabic plurals by `Intl.PluralRules`.
- On the Arabic screens no Latin letters: «أنلوك»، «إيفولف» (the English names in `en` / `enSub` for the English interface).
- Copy says only facts taken from the chats' own descriptions and the bots' own descriptions; no member counts; no «مجاني»-style claims.
- `npm run build` after any change in `public/` (sw.js list, pages); the tests fail otherwise and `tg-app-deploy` refuses.
- Preview first (`tg-app-deploy --preview`), screenshots to the owner; live only on the owner's word.
- Work on branch `kku-telegram`; commit after each task.

---

### Task 1: The list in the data, and the pure helpers

**Files:**
- Modify: `tools/import-kku.mjs` (constant `TELEGRAM`, `telegram` in the output)
- Modify: `public/assets/js/app/kku.js` (`TG_KINDS`, `tgUrl`)
- Modify: `docs/superpowers/specs/2026-11-11-kku-telegram-directory-design.md` (names as written below: «أنلوك»، «إيفولف»)
- Test: `tests/kku.test.mjs`

**Produces:**
- `kku.json.telegram = { channels: Item[], bots: Item[], groups: Item[] }`, `Item = { handle, title, sub, en, enSub }` (handle without `@`).
- `kku.js`: `export const TG_KINDS = ['channels', 'bots', 'groups']`, `export const tgUrl = (handle) => string`.

- [ ] **Step 1: the failing test** — add to `tests/kku.test.mjs` (extend the import line with `TG_KINDS, tgUrl`):

```js
test('the Telegram directory: five channels, nine bots, nine groups, each with its name and line in both languages', () => {
  assert.deepEqual(TG_KINDS, ['channels', 'bots', 'groups']);
  assert.deepEqual(TG_KINDS.map((k) => data.telegram[k].length), [5, 9, 9]);
  const handles = TG_KINDS.flatMap((k) => data.telegram[k].map((i) => i.handle));
  assert.equal(new Set(handles).size, handles.length, 'a handle listed twice');
  for (const kind of TG_KINDS) {
    for (const item of data.telegram[kind]) {
      assert.match(item.handle, /^[A-Za-z][A-Za-z0-9_]{4,31}$/, item.handle);
      assert.ok(item.title && item.sub && item.en && item.enSub, item.handle);
      assert.doesNotMatch(item.title + item.sub, /[A-Za-z]/, `English on the Arabic screen: ${item.handle}`);
    }
  }
  for (const h of [data.channel, data.bot, data.uni]) assert.ok(handles.includes(h), h);
  assert.equal(tgUrl('TalkKKU'), 'https://t.me/TalkKKU');
});
```

- [ ] **Step 2: run it, see it fail** — `node --test tests/kku.test.mjs` → fails: `TG_KINDS` is not exported.

- [ ] **Step 3: the helpers** — append to `public/assets/js/app/kku.js`:

```js
/** The owner's Telegram directory on the page (data.telegram), in this order. */
export const TG_KINDS = ['channels', 'bots', 'groups'];
export const tgUrl = (handle) => `https://t.me/${handle}`;
```

- [ ] **Step 4: the list** — in `tools/import-kku.mjs`, after `ARABIC`, add the constant, and add `telegram: TELEGRAM` to `out` (before `smartpro`). Update the header comment: the page also lists the owner's channels, bots and groups (`TELEGRAM`); adding one is a line there, then this tool and `npm run build`.

```js
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
```

- [ ] **Step 5: regenerate and run** — `node tools/import-kku.mjs && node --test tests/kku.test.mjs` → the new test passes; the older ones still pass.

- [ ] **Step 6: the spec's names** — in the spec's list, write the titles as above (أنلوك / إيفولف forms, «بوت إيفولف», «بوت أنلوك», «نقاش أنلوك») and add one line: «Arabic only on the Arabic screen, as for the course list (the Latin product names stay in `en`).» In its «Data and code» section the keys are `kku.tg`, `kku.tg.channels`, `kku.tg.bots`, `kku.tg.groups` and `n.links` (not `kku.tgChannels`… / `n.chats`).

- [ ] **Step 7: commit**

```bash
git add tools/import-kku.mjs public/data/kku.json public/assets/js/app/kku.js tests/kku.test.mjs docs/superpowers/specs/2026-11-11-kku-telegram-directory-design.md
git commit -m "KKU leaks list: the owner's Telegram channels, bots and groups in the page data"
```

---

### Task 2: The section in the app

**Files:**
- Modify: `public/assets/js/app/views/kku.js` (rows, three cards, the section after the colleges; hidden while a search is typed)
- Modify: `public/assets/js/app/i18n.js` (`kku.tg`, `kku.tg.channels`, `kku.tg.bots`, `kku.tg.groups`, `n.links`)
- Modify: `public/assets/js/quiz/dom.js` (`users` icon)
- Modify: `public/assets/css/app.css` (`.kku-heading`, the smaller icon in a row)
- Test: `tests/i18n.test.mjs` already checks every key has both languages (no new test file; the strings test covers the keys, and Task 3's test covers the rendered words).

**Consumes:** `TG_KINDS`, `tgUrl` from `kku.js`; `data.telegram` from `kku.json`.

- [ ] **Step 1: strings** — in `i18n.js`, under the `// KKU leaks list (/kku)` block:

```js
  'kku.tg': { en: 'King Khalid University on Telegram', ar: 'جامعة الملك خالد على تيليجرام' },
  'kku.tg.channels': { en: 'Channels', ar: 'القنوات' },
  'kku.tg.bots': { en: 'Bots', ar: 'البوتات' },
  'kku.tg.groups': { en: 'Groups', ar: 'القروبات' },
```

and beside `n.files`:

```js
  'n.links': {
    en: { one: '{n} link', other: '{n} links' },
    ar: { zero: 'لا روابط', one: 'رابط واحد', two: 'رابطان', few: '{n} روابط', many: '{n} رابطًا', other: '{n} رابط' },
  },
```

- [ ] **Step 2: the icon** — in `quiz/dom.js` `ICONS`, after `robot` (Tabler «users», outline):

```js
  users: ["M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2", "M16 3.13a4 4 0 0 1 0 7.75", "M21 21v-2a4 4 0 0 0 -3 -3.85"],
```

- [ ] **Step 3: the view** — in `views/kku.js`, import `TG_KINDS, tgUrl` from `../kku.js`, then add after `collegeCard`:

```js
const TG_ICONS = { channels: 'telegram', bots: 'robot', groups: 'users' };

function telegramRow(kind, item) {
  const ar = lang() === 'ar';
  return h('li', {},
    h('a', { class: 'kku-course kku-tg', href: tgUrl(item.handle), target: '_blank', rel: 'noopener noreferrer',
      onclick: () => track('kku_tg', { kind, handle: item.handle }) },
      h('span', { class: 'kku-link__icon' }, icon(...ICONS[TG_ICONS[kind]])),
      h('span', { class: 'kku-course__copy' },
        h('span', { class: 'kku-course__title' }, ar ? item.title : item.en),
        h('span', { class: 'kku-course__meta' }, ar ? item.sub : item.enSub)),
      h('span', { class: 'kku-go' }, forwardIcon())));
}

/** One closed card per kind (channels, bots, groups), styled like a college card. */
function telegramKindCard(data, kind) {
  const items = data.telegram[kind];
  return h('details', { class: 'card kku-college' },
    h('summary', {},
      h('span', { class: 'kku-college__copy' },
        h('span', { class: 'kku-college__name' }, t(`kku.tg.${kind}`)),
        h('span', { class: 'kku-college__count' }, t('n.links', { n: items.length }))),
      h('span', { class: 'kku-go kku-college__toggle' }, icon(...ICONS.plus))),
    h('ul', { class: 'kku-courses' }, items.map((item) => telegramRow(kind, item))));
}
```

In `showKku`, before `mount(...)`:

```js
  const telegram = h('section', { class: 'kku-telegram' },
    h('h2', { class: 'kku-heading' }, t('kku.tg')),
    h('div', { class: 'kku-colleges' }, TG_KINDS.map((kind) => telegramKindCard(data, kind))));
```

in the search `oninput`, after `none.hidden = ...`: `telegram.hidden = Boolean(q);` (a search shows courses only); and in `body`, after the colleges `div`: `telegram,`.

- [ ] **Step 4: styles** — in `app.css`, after the `.kku-course__meta` rule:

```css
.kku-telegram{display:grid;gap:10px}
.kku-telegram[hidden]{display:none}
.kku-heading{margin:6px 2px 0;font:800 16px/1.3 var(--ui);color:var(--ink)}
.kku-tg .kku-link__icon{width:36px;height:36px}
.kku-tg .kku-link__icon svg{width:18px;height:18px}
```

- [ ] **Step 5: build and test** — `npm run build && npm test` → green (the i18n test sees the new keys in both languages; sw.js regenerated).

- [ ] **Step 6: commit**

```bash
git add public/assets/js/app/views/kku.js public/assets/js/app/i18n.js public/assets/js/quiz/dom.js public/assets/css/app.css public/sw.js
git commit -m "KKU leaks list: the Telegram channels, bots and groups as three cards at the end of the page"
```

---

### Task 3: The page search engines read

**Files:**
- Modify: `tools/build-pages.mjs` (the section after the colleges)
- Modify: `public/assets/js/app/i18n.js` (`meta.kkuDesc`)
- Test: `tests/kku.test.mjs`

**Consumes:** `TG_KINDS` from `kku.js`; `kku.telegram`; the `kku.tg*` strings from Task 2.

- [ ] **Step 1: the failing test** — in the test «search engines read a /kku page…», before the sitemap assertion:

```js
  assert.ok(page.includes('<h2>جامعة الملك خالد على تيليجرام</h2>'), 'the Telegram section');
  for (const [kind, heading] of [['channels', 'القنوات'], ['bots', 'البوتات'], ['groups', 'القروبات']]) {
    assert.ok(page.includes(`<h3>${heading}</h3>`), heading);
    for (const item of data.telegram[kind]) assert.ok(page.includes(`<a href="https://t.me/${item.handle}">${item.title}</a>: ${item.sub}`), item.handle);
  }
  assert.match(page, /<meta name="description" content="[^"]*قنوات جامعة الملك خالد وقروباتها وبوتاتها على تيليجرام[^"]*">/);
```

- [ ] **Step 2: run, see it fail** — `node --test tests/kku.test.mjs`.

- [ ] **Step 3: the description** — `meta.kkuDesc` in `i18n.js`:

```js
  'meta.kkuDesc': {
    en: 'The King Khalid University courses of the Telegram channel «KKU leaks and collections», by college: each course opens its post in the channel, with links to its files (finals, midterms, quizzes, summaries and question banks). Plus the university’s Telegram channels, groups and bots.',
    ar: 'مقررات جامعة الملك خالد في قناة تسريبات وتجميعات جامعة الملك خالد على تيليجرام، مرتبة حسب الكلية: كل مقرر يفتح منشوره في القناة، وفيه روابط ملفاته من اختبارات نهائية وميد وكويزات وملخصات وبنوك أسئلة. ومعها قنوات جامعة الملك خالد وقروباتها وبوتاتها على تيليجرام.',
  },
```

- [ ] **Step 4: the builder** — in `build-pages.mjs`, import `TG_KINDS` from `'../public/assets/js/app/kku.js'`; in the `kku` page body, after the colleges' `map(...)`:

```js
      h('h2', {}, esc(ar('kku.tg'))),
      TG_KINDS.map((kind) => h('h3', {}, esc(ar(`kku.tg.${kind}`))) + h('ul', {}, kku.telegram[kind].map((item) =>
        h('li', {}, `<a href="${tme(item.handle)}">${esc(item.title)}</a>: ${esc(item.sub)}`)))),
```

Update the comment above the page: «…, then the owner's Telegram channels, bots and groups, each a link with its line.»

- [ ] **Step 5: build and test** — `npm run build && npm test` → green; `git diff --stat public/pages` shows `kku.html` (the section) and every page (the description is only on /kku, so only `kku.html` and the pages whose meta changed).

- [ ] **Step 6: commit**

```bash
git add tools/build-pages.mjs public/assets/js/app/i18n.js public/pages tests/kku.test.mjs public/sw.js
git commit -m "KKU leaks list: the Telegram directory in the page search engines read, and in its description"
```

---

### Task 4: Preview, screenshots, the owner's word, live

- [ ] `tg-app-deploy --preview` (tests run inside it). Preview: `https://smartpro-edu.com/preview/kku`.
- [ ] Screenshots with Playwright (`/root/kku-system/node_modules` has it; `node -e` script in the scratchpad), phone width 390×844, Arabic: (1) the end of the page with the three cards closed, (2) «البوتات» open, (3) «القروبات» open; (4) the same address with JavaScript off (`javaScriptEnabled: false`), scrolled to the section, as search engines read it. Send them to the owner with one Arabic line each.
- [ ] Live only on the owner's word: `git checkout main && git merge --ff-only kku-telegram && git push origin main`, then `tg-app-deploy`. Then open `https://smartpro-edu.com/kku`, check the section, and `curl -s https://smartpro-edu.com/kku | grep -c 't.me/'` ≥ 23 + the course links.
- [ ] Afterwards, in Google Search Console (the owner's account), ask for `/kku` to be re-crawled: tell the owner the address to paste («فحص عنوان URL» → «طلب الفهرسة»); not something we can do from the server.
