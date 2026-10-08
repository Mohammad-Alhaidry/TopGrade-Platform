// Home, laid out like the TopGrade dashboard: gradient welcome card with two figures and two actions,
// continue where they left off, progress KPIs, what needs attention, their courses, and WhatsApp help.

import { h, icon, ICONS, WHATSAPP_SVG, staticSvg } from '../../quiz/dom.js';
import { createSession } from '../../quiz/session.js';
import { screen, tabbar, mount, forwardIcon, enText, WHATSAPP_URL } from '../shell.js';
import { href, navigate } from '../router.js';
import { paths } from '../routes.js';
import { readProgress, overall, streak } from '../progress.js';
import { topicKey } from '../catalog.js';
import { savedRunTopic, readSavedRun, queueRun, newRun } from '../quiz.js';
import { installOffer, promptInstall, dismissInstall, onInstallChange } from '../install.js';
import { t, lang } from '../i18n.js';
import { courseSummaries, courseCard } from './courses.js';

const QUICK_COUNT = 10;

const today = () => new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function heroStat(value, label) {
  return h('div', { class: 'hero__stat' },
    h('span', { class: 'hero__stat-value' }, value),
    h('span', { class: 'hero__stat-label' }, label));
}

/** Quick quiz: the most recently studied topic, else the first one. */
function quickQuiz(summaries) {
  const lastKey = readProgress().last?.topic;
  const all = summaries.flatMap(({ course, topics }) => topics.map((x) => ({ course, ...x })));
  const pick = all.find((x) => topicKey(x.course, x.topic) === lastKey) ?? all[0];
  queueRun(pick.course, pick.topic, newRun(createSession(pick.bank, { count: QUICK_COUNT, mode: 'practice' })));
  navigate(paths.topic(pick.course.id, pick.topic.id));
}

function hero(progress, totals, summaries) {
  const all = overall(progress);
  const days = streak(progress);
  const returning = all.answered > 0;
  return h('section', { class: 'hero', 'aria-labelledby': 'hero-title' },
    h('div', { class: 'hero__meta' },
      h('span', { class: 'hero__chip' }, t('home.student')),
      h('time', { class: 'hero__date' }, today())),
    h('h1', { class: 'hero__title', id: 'hero-title', tabindex: '-1', 'data-autofocus': true }, t(returning ? 'home.welcomeBack' : 'home.welcome')),
    lang() === 'en' ? h('p', { class: 'hero__ar', lang: 'ar', dir: 'rtl' }, t('tagline', {}, 'ar')) : h('p', { class: 'hero__ar' }, t('tagline')),
    h('div', { class: 'hero__stats' },
      returning
        ? [heroStat(t('n.days', { n: days }), t('home.streak')), heroStat(String(all.answered), t('home.answered'))]
        : [heroStat(String(totals.questions), t('home.practiceQuestions')), heroStat(String(totals.courses), t('home.coursesCount', { n: totals.courses }))]),
    h('div', { class: 'hero__actions' },
      h('a', { class: 'btn btn--glass', href: href(paths.courses()) }, t('home.coursesBtn')),
      h('button', { type: 'button', class: 'btn btn--light', onclick: () => quickQuiz(summaries) }, t('home.quick'))));
}

function kpi(tone, iconPaths, value, label, link) {
  const inner = [
    h('span', { class: 'kpi__icon' }, icon(...iconPaths)),
    h('span', { class: 'kpi__copy' }, h('span', { class: 'kpi__value', dir: 'ltr' }, value), h('span', { class: 'kpi__label' }, label)),
  ];
  return link ? h('a', { class: `kpi kpi--${tone}`, href: link }, inner) : h('div', { class: `kpi kpi--${tone}` }, inner);
}

function progressKpis(progress, summaries, mistakes) {
  const all = overall(progress);
  const totalQ = summaries.reduce((n, c) => n + c.totalQuestions, 0);
  const mastered = summaries.reduce((n, c) => n + c.mastered, 0);
  const bests = summaries.flatMap((c) => c.topics.map((x) => x.stats.best)).filter((b) => b !== null);
  return h('div', { class: 'kpis' },
    kpi('green', ICONS.target, all.accuracy === null ? '-' : `${all.accuracy}%`, t('kpi.accuracy'), null),
    kpi('blue', ICONS.check, totalQ ? `${Math.round((mastered / totalQ) * 100)}%` : '-', t('kpi.mastered'), href(paths.courses())),
    kpi('amber', ICONS.flame, bests.length ? `${Math.max(...bests)}%` : '-', t('kpi.best'), null),
    kpi('red', ICONS.retry, String(mistakes), t('kpi.review'), href(paths.review())));
}

function attentionCard(mistakes) {
  if (!mistakes) return null;
  return h('section', { class: 'attention', 'aria-labelledby': 'attention-title' },
    h('h2', { class: 'attention__head', id: 'attention-title' },
      h('span', { class: 'attention__icon' }, icon(...ICONS.alert)), t('home.attention')),
    h('a', { class: 'attention__row', href: href(paths.review()) },
      h('span', {}, t('home.wrongCount', { n: mistakes })),
      h('span', {}, t('practise'), forwardIcon())));
}

function continueCard(summaries) {
  // An unfinished quiz comes first; otherwise the topic they used last.
  const savedKey = savedRunTopic();
  const lastKey = readProgress().last?.topic;
  for (const k of [savedKey, lastKey]) {
    if (!k) continue;
    for (const { course, topics } of summaries) {
      const x = topics.find((y) => topicKey(course, y.topic) === k);
      if (!x) continue;
      const run = k === savedKey ? readSavedRun(x.bank) : null;
      const title = run ? t(run.kind === 'mistakes' ? 'cont.mistakes' : `cont.${run.session.mode}`) : t('cont.study');
      const detail = run ? t('qOfN', { i: run.index + 1, n: run.session.items.length }) : t('masteredPct', { p: x.stats.percent });
      const go = () => {
        if (run) queueRun(course, x.topic, run);
        navigate(paths.topic(course.id, x.topic.id));
      };
      return h('button', { type: 'button', class: 'card continue', onclick: go },
        h('span', { class: 'continue__icon' }, icon(...(run ? ICONS.exam : ICONS.book))),
        h('span', { class: 'continue__copy' },
          h('span', { class: 'continue__title' }, title),
          h('span', { class: 'continue__text' }, t('topicN', { n: x.topic.number }), ': ', h('span', enText(), x.topic.title)),
          h('span', { class: 'continue__meta' }, detail)),
        h('span', { class: 'continue__go' }, forwardIcon()));
    }
  }
  return null;
}

function installCard() {
  const offer = installOffer();
  if (!offer) return null;
  const close = h('button', { type: 'button', class: 'install__close', 'aria-label': t('inst.notNow'), onclick: dismissInstall }, icon(...ICONS.close));
  const body = offer === 'prompt'
    ? h('p', { class: 'install__text' }, t('inst.text'))
    : h('ol', { class: 'install__steps' },
        h('li', {}, t('inst.tap'), ' ', h('span', { class: 'install__key', 'aria-label': t('inst.share') }, icon(...ICONS.share)), ' ', t('inst.shareBar')),
        h('li', {}, t('inst.choose'), ' ', h('strong', {}, t('inst.addHome')), ' ', h('span', { class: 'install__key', 'aria-hidden': 'true' }, icon(...ICONS.addSquare))));
  return h('section', { class: 'card install', 'aria-labelledby': 'install-title' },
    h('img', { class: 'install__icon', src: 'assets/icons/icon-192.png', width: '192', height: '192', alt: '' }),
    h('div', { class: 'install__copy' },
      h('h2', { class: 'install__title', id: 'install-title' }, t(offer === 'ios' ? 'inst.titleIos' : 'inst.title')),
      body,
      offer === 'prompt'
        ? h('button', { type: 'button', class: 'btn btn--primary btn--sm install__btn', onclick: promptInstall }, icon(...ICONS.download), h('span', {}, t('inst.btn')))
        : null),
    close);
}

let stopInstallUpdates = () => {};

function helpCard() {
  return h('a', { class: 'card help', href: WHATSAPP_URL, target: '_blank', rel: 'noopener noreferrer' },
    h('span', { class: 'help__icon' }, staticSvg(WHATSAPP_SVG)),
    h('span', { class: 'help__copy' },
      h('span', { class: 'help__title' }, t('home.help')),
      h('span', { class: 'help__ar' }, t('home.helpSub'))),
    h('span', { class: 'help__go' }, forwardIcon()));
}

export async function showHome(ctx) {
  const token = ctx.token;
  const summaries = await courseSummaries(ctx);
  if (token !== ctx.token) return;
  const progress = readProgress();
  const totals = {
    courses: summaries.length,
    questions: summaries.reduce((n, c) => n + c.totalQuestions, 0),
  };
  const mistakes = summaries.reduce((n, c) => n + c.mistakes, 0);

  // The install offer can appear late (Android fires its prompt event after load) or go away.
  const installSlot = h('div', { class: 'slot' }, installCard());
  stopInstallUpdates();
  stopInstallUpdates = onInstallChange(() => installSlot.replaceChildren(installCard() ?? ''));

  mount(screen({
    className: 'screen--home',
    body: [
      hero(progress, totals, summaries),
      continueCard(summaries),
      installSlot,
      h('h2', { class: 'section-label' }, t('home.progress')),
      progressKpis(progress, summaries, mistakes),
      attentionCard(mistakes),
      h('div', { class: 'section-head' },
        h('h2', {}, t('home.yourCourses')),
        h('a', { href: href(paths.courses()) }, t('home.seeAll'))),
      summaries.slice(0, 3).map(courseCard),
      helpCard(),
      h('p', { class: 'fineprint' },
        h('a', { href: href(paths.privacy()) }, t('home.privacy')),
        h('span', { 'aria-hidden': 'true' }, ' · '),
        t('home.saved')),
    ],
    foot: tabbar('home', { badge: mistakes }),
  }));
}
