# The owner's Telegram channels, bots and groups on the /kku page

Approved by the owner on 2026-11-11 («تمام»). Owner's words: «ابي البوتات حقي يكون كامل والقنوات حق تيليجرام والقروبات
تضيفها في الصفحة حق التسريبات حق سمارت برو عشان يتعرف عليها جوجل وتكون تطلع بالبحث».

## Why

Google lists a t.me page only when a website links to it with some text around the link. Smart Pro's `/kku` page
already links the leaks channel, its bot and the university channel. The owner's other channels, bots and groups
have no link from any website. Listing all of them on `/kku`, each with a line saying what it is, gives Google the
links and the words a student searches for («قروبات جامعة الملك خالد تيليجرام», «بوت جامعة الملك خالد»).

## What the page shows

A section «جامعة الملك خالد على تيليجرام» under the colleges, in the app and in the prerendered page.

In the app: three tap-to-open cards styled like the college cards, closed by default so the course list stays as
short as it is: «القنوات» (5), «البوتات» (9), «القروبات» (9). Each row: a round Telegram-blue icon (paper plane for
channels, robot for bots, people for groups), the name, a line under it saying what it is, and it opens in Telegram
(new tab). The three cards at the top of the page (the channel, the bot, the university channel) stay as they are.

In the prerendered `pages/kku.html` (what Google reads): after the colleges, an `h2` «جامعة الملك خالد على تيليجرام»,
then an `h3` per kind («القنوات», «البوتات», «القروبات»), each a `ul` whose items are `<a href="https://t.me/…">name</a>:
line`. The page's meta description (`meta.kkuDesc`) also says the page lists the university's Telegram channels,
groups and bots. No new URL, so the sitemap does not change.

Usage counted in Umami: `kku_tg` with the kind and the handle.

## The list

Names are the owner's short names; the lines come from the chats' own Telegram descriptions and the bots' own
descriptions (profiles/*.json identity), shortened. Member counts are not shown (they go stale). Items the owner left
out on 2026-11-11: @topgrade7 «TopGrade Unlock» (the old Unlock channel), @Dir3GuardBot «درع» (a moderation bot).

Channels:
- @ExamLeaks_KKU «تسريبات وتجميعات جامعة الملك خالد»: ملفات المقررات من اختبارات سابقة وملخصات وبنوك أسئلة.
- @Kku_One «قناة جامعة الملك خالد»: أخبار الجامعة ومواعيد القبول والتسجيل والتقويم الجامعي.
- @KkU_LiNkS1 «روابط قروبات الشعب»: روابط قروبات الشعب لكل التخصصات.
- @UnLoCk3RdBest «Unlock 1|2|3»: كتب Unlock الإصدار الثالث وحلولها وكتب المعلم وصوتياتها.
- @EnglishEvolove1234 «English Evolve 1|2|3|4»: كتب Evolve وحلولها وملفات الوحدات.

Bots:
- @KingKhalidLeaks_bot «بوت التسريبات والتجميعات»: اختر كليتك وتخصصك ومستواك وتوصلك ملفات مقرراتك.
- @KKU_One_Bot «بوت الدليل»: اختر كليتك ويفتح لك بوتها، أو ابحث عن أي مقرر في كل الكليات.
- @KKU_Health_Bot «بوت المسار الصحي»: مقررات الكليات الصحية وملفاتها مرتبة حسب التخصص والترم.
- @KKU_Engineering_Bot «بوت الهندسة»: مقررات كلية الهندسة وملفاتها مرتبة حسب التخصص والترم.
- @KKU_CS_Bot «بوت الحاسب»: مقررات كلية علوم الحاسب وملفاتها مرتبة حسب التخصص والترم.
- @KKU_Business_Bot «بوت الأعمال»: مقررات كلية الأعمال وملفاتها مرتبة حسب التخصص والترم.
- @KKU_Science_Bot «بوت العلوم»: مقررات كلية العلوم وملفاتها مرتبة حسب التخصص والترم.
- @EnglishEvolve1234Bot «بوت English Evolve»: ملفات Evolve مرتبة حسب المستوى.
- @UnLoCk123BeStBot «بوت Unlock»: كتب Unlock 1|2|3 وحلولها وصوتياتها.

Groups:
- @TalkKKU «مناقشة جامعة الملك خالد»: القروب العام: نقاش واستفسارات وملخصات وأخبار الكليات والجداول.
- @KkuGirls «بنات جامعة الملك خالد»: قروب البنات: المقررات والاستفسارات والأخبار الجامعية.
- @Kku_Diploma «دبلوم جامعة الملك خالد»: قروب الدبلوم: المقررات والمواد التعليمية والاستفسارات.
- @Kku_medics «التخصصات الصحية»: قروب التخصصات الصحية: المقررات والمصادر والاستفسارات.
- @KKU_SCI «كلية العلوم»: قروب كلية العلوم: المقررات والموارد والاستفسارات.
- @KKU_CS «كلية علوم الحاسب»: قروب كلية علوم الحاسب: المقررات والموارد والاستفسارات.
- @KKU_BIZ «كلية الأعمال»: قروب كلية الأعمال: المقررات والاستفسارات وأخبار الكلية.
- @ENG_KKU «انجليزي مكثف»: قروب الإنجليزي المكثف: موضوعات المقرر والاستفسارات.
- @UnLoCk3Rd_Discussion «نقاش Unlock»: قروب نقاش قناة Unlock 1|2|3.

The English interface shows an English name and line for each (the `en` and `enSub` fields).

## Data and code

- The list lives in `tools/import-kku.mjs` as a constant `TELEGRAM = { channels, bots, groups }` (each item
  `{ handle, title, sub, en, enSub }`) and is written into `public/data/kku.json` as `telegram`. Adding a chat later
  is one line there, then `node tools/import-kku.mjs && npm run build`.
- `public/assets/js/app/kku.js`: `tgUrl(handle)` → `https://t.me/<handle>`; `TG_KINDS = ['channels', 'bots', 'groups']`.
- `public/assets/js/app/views/kku.js`: `telegramKindCard(data, kind)` builds one closed card per kind, reusing the
  college-card markup (`details.card.kku-college`) and the `telegramCard` row style; the section is mounted after
  the colleges.
- `tools/build-pages.mjs`: the `/kku` page body gets the section after the colleges.
- `public/assets/js/app/i18n.js`: `kku.tg` (section title), `kku.tgChannels`, `kku.tgBots`, `kku.tgGroups`,
  `n.chats` («{n} روابط» style count for the card header), and the new `meta.kkuDesc`.
- `public/assets/js/quiz/dom.js`: a `users` icon path for the groups.
- Tests (`tests/kku.test.mjs`): every item has a handle, title, sub, en and enSub; handles are unique across the
  three kinds; the prerendered page links every handle with its title; the meta description mentions the groups
  and bots.

## Not in scope

- Member counts on the page.
- A separate directory page or new URL.
- Any change to the bots or the channels.
