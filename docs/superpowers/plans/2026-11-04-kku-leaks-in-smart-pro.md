# The KKU leaks list in Smart Pro: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/kku` page in Smart Pro listing every course of @ExamLeaks_KKU by college (each opening its channel post), reachable from a fourth tab and from the four shared course pages; then a Smart Pro line in those courses' channel posts and in the leaks bot.

**Architecture:** One data file (`public/data/kku.json`) made by a tool from the leaks bot's catalog; a pure module (`kku.js`: load, fold, match) used by a new view (`views/kku.js`) and by the course view; the prerender tool adds a static `/kku` copy for search engines. Part 2 works in /root/kku-system (`leaks_publish.header`, the bot's catalog).

**Tech Stack:** Plain ES modules (no bundler), `node --test`; Python (python-telegram-bot) for part 2.

## Global Constraints

- Interface strings exist in English and Arabic (`i18n.js`; tests enforce it); Arabic plurals by `Intl.PluralRules`.
- On the Arabic screens, no English words: book names written «إيفولف»، «أنلوك» (English kept in an `en` field for search).
- No inline script or style in pages (CSP); `npm run build` after any change in `public/` (sw.js list, pages, sitemap).
- Copy says only facts: titles and actions, no claims.
- The owner sees screenshots of the preview before anything goes live; channel edits are silent (edit, no new post).

---

### Task 1: Data and the pure module

**Files:** Create `tools/import-kku.mjs`, `public/data/kku.json`, `public/assets/js/app/kku.js`, `tests/kku.test.mjs`.

**Produces:**
- `kku.json`: `{ channel, bot, total, colleges: [{ id, name, en, courses: [{ title, en?, post, files }] }], smartpro: { <courseId>: <post> } }`
- `kku.js`: `loadKku(dataUrl) -> Promise<data>` (cached), `fold(text) -> string`, `matches(course, foldedQuery) -> boolean`, `postUrl(data, post) -> string`, `channelUrl(data)`, `botUrl(data)`.

- [ ] Test: data shape (8 colleges with unique ids, every course has a title, post and files; no Latin letters in Arabic titles; the four `smartpro` ids exist in `catalog.json`); `fold('الإحصاء') === fold('الاحصاء')`, `fold('مقدمة') === fold('مقدمه')`; `matches` finds by Arabic or by `en` («evolve»).
- [ ] Run, see it fail; write the tool and the module; `node tools/import-kku.mjs`; run, see it pass; commit.

### Task 2: Route, tab, view, course-page row, styles

**Files:** Modify `routes.js` (`kku` route, `paths.kku`), `shell.js` (fourth tab), `main.js` (render + safe-to-update), `i18n.js` (strings), `meta.js` (title, description), `views/course.js` (row), `app.css` (tab bar of four, `.kku-*`), `quiz/dom.js` (icons: telegram, robot, search, plus, files). Create `views/kku.js`. Test: `tests/routes.test.mjs`, `tests/kku.test.mjs`.

**Consumes:** Task 1's `kku.js`.

- [ ] Test: `matchRoute('kku')` is `{ name: 'kku' }`, `matchRoute('kku/x')` is not found; titles for `kku` in both languages.
- [ ] Implement; the view: page bar (title, sub line, course count), channel and bot cards, search box, colleges as `<details>` cards whose rows open the post (`target=_blank`), «لا يوجد مقرر بهذا الاسم.» when nothing matches; Umami events `kku_course`, `kku_channel`, `kku_bot`, `kku_from_course`.
- [ ] Run all tests; commit.

### Task 3: The page search engines read

**Files:** Modify `tools/build-pages.mjs` (a `kku` page: h1, description, the channel and bot links, every college as h2 with its courses as links; breadcrumb data). Test: `tests/kku.test.mjs`.

- [ ] Test: `generated()['pages/kku.html']` has the title, every course's channel link, and the sitemap lists `/kku`.
- [ ] Implement; `npm run build`; all tests pass; commit.

### Task 4: Preview and the owner's look

- [ ] `tg-app-deploy --preview`; screenshots at phone width (page, a college open, a search, the course-page row, the tab bar) and desktop; send to the owner. Live only on the owner's word: merge to `main`, `tg-app-deploy`.

### Task 5 (part 2): Smart Pro in the channel posts and the bot

**Files:** /root/kku-system: `tools/leaks_publish.py` (`header()` adds the Smart Pro line for courses with a `smartpro` id), course JSONs of the four courses (`"smartpro": "<course id>"`), `tools/leaks_catalog.py` (bot copies of the line use `utm_source=leaks_bot`), `kkubot/leaks.py` (home button «🎯 تطبيق سمارت برو» answering with Smart Pro's courses as links), tests in `tests/test_leaks.py`.

- [ ] Test the header line and the bot button; implement; re-edit the four channel posts silently (`publish(..., force_header=True)`); rebuild the bot catalog; back up the bot's database; restart the bot; check the posts and the bot.
