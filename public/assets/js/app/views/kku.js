// The KKU leaks list: the courses of the Telegram channel «تسريبات وتجميعات جامعة الملك خالد», by college. Each course
// opens its post in the channel; a search box narrows every college at once. The colleges open on tap.

import { h, icon, ICONS } from '../../quiz/dom.js';
import { pagebar, screen, tabbar, mount, forwardIcon } from '../shell.js';
import { t, lang } from '../i18n.js';
import { track } from '../analytics.js';
import { loadKku, fold, matches, postUrl, channelUrl, botUrl } from '../kku.js';
import { courseSummaries } from './courses.js';

/** A Telegram card (the channel, the bot, or a course's post): blue round icon, title, line under it. */
export function telegramCard({ href, iconPaths, title, sub, onclick }) {
  return h('a', { class: 'card kku-link', href, target: '_blank', rel: 'noopener noreferrer', onclick },
    h('span', { class: 'kku-link__icon' }, icon(...iconPaths)),
    h('span', { class: 'kku-link__copy' },
      h('span', { class: 'kku-link__title' }, title),
      sub ? h('span', { class: 'kku-link__sub' }, sub) : null),
    h('span', { class: 'kku-go' }, forwardIcon()));
}

function courseRow(data, course) {
  const row = h('li', {},
    h('a', { class: 'kku-course', href: postUrl(data, course.post), target: '_blank', rel: 'noopener noreferrer',
      onclick: () => track('kku_course', { course: course.en ?? course.title }) },
      h('span', { class: 'kku-course__copy' },
        h('span', { class: 'kku-course__title' }, course.title),
        h('span', { class: 'kku-course__meta' }, t('n.files', { n: course.files }))),
      h('span', { class: 'kku-go' }, forwardIcon())));
  return { row, course };
}

function collegeCard(data, college) {
  const rows = college.courses.map((c) => courseRow(data, c));
  const count = h('span', { class: 'kku-college__count' }, t('n.courses', { n: rows.length }));
  const card = h('details', { class: 'card kku-college' },
    h('summary', {},
      h('span', { class: 'kku-college__copy' },
        h('span', { class: 'kku-college__name' }, lang() === 'ar' ? college.name : college.en),
        count),
      h('span', { class: 'kku-go kku-college__toggle' }, icon(...ICONS.plus))),
    h('ul', { class: 'kku-courses' }, rows.map((r) => r.row)));
  /** Shows only the courses matching q (folded); returns how many. */
  const filter = (q) => {
    let n = 0;
    for (const { row, course } of rows) {
      const hit = matches(course, q);
      row.hidden = !hit;
      n += hit;
    }
    card.hidden = Boolean(q) && n === 0;
    card.open = Boolean(q) && n > 0;
    count.textContent = t('n.courses', { n: q ? n : rows.length });
    return n;
  };
  return { card, filter };
}

export async function showKku(ctx) {
  const token = ctx.token;
  const [data, summaries] = await Promise.all([loadKku(ctx.dataUrl), courseSummaries(ctx)]);
  if (token !== ctx.token) return;
  const mistakes = summaries.reduce((n, c) => n + c.mistakes, 0);
  const colleges = data.colleges.map((col) => collegeCard(data, col));
  const none = h('p', { class: 'kku-none', hidden: true, role: 'status' }, t('kku.none'));
  let searched = false;
  const input = h('input', {
    type: 'search', placeholder: t('kku.search'), 'aria-label': t('kku.searchLabel'), enterkeyhint: 'search', autocomplete: 'off',
    oninput: () => {
      const q = fold(input.value);
      const found = colleges.reduce((n, c) => n + c.filter(q), 0);
      none.hidden = !q || found > 0;
      if (q && !searched) {
        searched = true;
        track('kku_search');
      }
    },
  });

  mount(screen({
    className: 'screen--kku',
    bar: pagebar({ title: t('kku.title'), sub: t('kku.sub'), end: h('span', { class: 'pagebar__meta' }, t('n.courses', { n: data.total })) }),
    body: [
      h('div', { class: 'kku-links' },
        telegramCard({ href: channelUrl(data), iconPaths: ICONS.telegram, title: t('kku.channel'), sub: t('kku.title'), onclick: () => track('kku_channel') }),
        telegramCard({ href: botUrl(data), iconPaths: ICONS.robot, title: t('kku.bot'), sub: t('kku.botSub'), onclick: () => track('kku_bot') })),
      h('label', { class: 'card kku-search' }, icon(...ICONS.search), input),
      none,
      h('div', { class: 'kku-colleges' }, colleges.map((c) => c.card)),
    ],
    foot: tabbar('kku', { badge: mistakes }),
  }));
}
