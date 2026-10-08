// Review tab: every topic with open mistakes, each one a tap away from a practice run.

import { h, icon, ICONS } from '../../quiz/dom.js';
import { createSession } from '../../quiz/session.js';
import { pagebar, screen, tabbar, mount, contentText } from '../shell.js';
import { topicLabel } from '../catalog.js';
import { href, navigate } from '../router.js';
import { paths } from '../routes.js';
import { queueRun, newRun } from '../quiz.js';
import { t, lang, localName } from '../i18n.js';
import { courseSummaries } from './courses.js';

export async function showReview(ctx) {
  const token = ctx.token;
  const summaries = await courseSummaries(ctx);
  if (token !== ctx.token) return;
  const items = summaries.flatMap(({ course, topics }) =>
    topics.filter((x) => x.stats.mistakes.length).map((x) => ({ course, ...x })));
  const total = items.reduce((n, x) => n + x.stats.mistakes.length, 0);

  const practise = ({ course, topic, bank, stats }) => {
    queueRun(course, topic, newRun(createSession(bank, { ids: stats.mistakes, mode: 'practice' }), 'mistakes'));
    navigate(paths.topic(course.id, topic.id));
  };

  const body = items.length
    ? [
        h('p', { class: 'lead' }, t('review.lead')),
        h('div', { class: 'card-grid' }, items.map((x) =>
          h('section', { class: 'card review-topic' },
            h('span', { class: 'review-topic__count' }, String(x.stats.mistakes.length)),
            h('span', { class: 'review-topic__copy' },
              h('span', { class: 'review-topic__title' }, topicLabel(x.topic, lang()), ': ', h('span', contentText(x.course), x.topic.title)),
              h('span', { class: 'review-topic__course', lang: localName(x.course).mainLang }, localName(x.course).main)),
            h('button', { type: 'button', class: 'btn btn--primary btn--sm', onclick: () => practise(x) }, t('practise'))))),
      ]
    : h('section', { class: 'card empty' },
        h('span', { class: 'empty__icon' }, icon(...ICONS.target)),
        h('h2', {}, t('review.empty')),
        h('p', {}, t('review.emptyText')),
        h('a', { class: 'btn btn--primary', href: href(paths.courses()) }, t('browseCourses')));

  mount(screen({
    bar: pagebar({ title: t('review.title'), end: total ? h('span', { class: 'pagebar__meta' }, t('n.questions', { n: total })) : null }),
    body,
    foot: tabbar('review', { badge: total }),
  }));
}
