# The KKU leaks list in Smart Pro, and Smart Pro in the leaks bot and channel

Approved by the owner on 2026-11-04 («تم»), after a short study they asked for.

## Why

The Telegram channel «تسريبات وتجميعات جامعة الملك خالد» (@ExamLeaks_KKU, about 10,000 subscribers) and its bot
(@KingKhalidLeaks_bot) do not show in Google: Google lists a t.me page only when some website links to it. Smart Pro
is a website Google reads. A page there lists every course of the channel, so a student searching Google can land on
it, and the channel and the bot get links from outside Telegram. The owner also wants the channel and the bot to
bring students to Smart Pro's practice questions.

## 1. A page in Smart Pro: `/kku`

- Title «تسريبات وتجميعات جامعة الملك خالد» (English interface: "KKU leaks and collections"); the course count at
  the end of the page bar.
- Two cards: the channel and the bot (Telegram links).
- A search box: typing narrows every college at once (Arabic spellings folded: hamza, taa marbuta, alif maqsura).
- The colleges as tap-to-open cards (eight: the Applied College, Business, Computer Science, Health, Science,
  Engineering, English, other courses), each listing its courses with their file count; a course opens its post in
  the channel. Book names in Arabic (إيفولف، أنلوك).
- A fourth tab in the bottom bar: «التسريبات», beside Home, Courses and Review.
- On the page of each Smart Pro course that the channel also has (Problem Solving, Accounting 1, Calculus 1,
  Business Math): a row «ملفات المقرر في القناة» that opens its post.
- Search engines: a prerendered `/kku` page (title, description, every college and course as links) and an entry in
  the sitemap, as for the other pages.
- Data: `public/data/kku.json`, made by `tools/import-kku.mjs` from the leaks bot's catalog
  (`/root/kku-system/catalog/leaks.json`); rerun after the channel changes.
- Usage counted in Umami: a course opened, the channel card, the bot card.

## 2. Smart Pro in the bot and the channel

- Channel: the post of each of the four shared courses gets a last line «🎯 تدرّب على أسئلة المقرر في سمارت برو»
  linking to the course in Smart Pro (an edit, so subscribers get no notification).
- Bot: the course page is the channel post, so it shows the same line. The home screen gets one button
  «🎯 تطبيق سمارت برو» that answers with Smart Pro's courses, each a link.
- Links carry `utm_source=leaks_channel` or `utm_source=leaks_bot`, so Umami tells where visitors came from.
- A course added to Smart Pro later is added to the same places.

## Not in scope

- The page on topgradeedu.com (built as a preview first, then dropped: the owner chose Smart Pro).
- Promotion posts in the channel beyond the course-post line: only with the owner's own wording.
