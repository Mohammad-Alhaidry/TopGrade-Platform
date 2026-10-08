// One course: its title card and the list of topics with the student's progress in each.

import { h } from '../../quiz/dom.js';
import { pagebar, screen, tabbar, mount, meter, backLink, forwardIcon, enText } from '../shell.js';
import { href } from '../router.js';
import { paths } from '../routes.js';
import { t, localName } from '../i18n.js';
import { courseSummaries } from './courses.js';

function topicCard(course, { topic, stats }) {
  return h('a', { class: 'card topic-card', href: href(paths.topic(course.id, topic.id)) },
    h('span', { class: 'topic-card__num', 'aria-hidden': 'true' }, String(topic.number)),
    h('span', { class: 'topic-card__copy' },
      h('span', { class: 'topic-card__label' }, t('topicN', { n: topic.number })),
      h('span', enText({ class: 'topic-card__title' }), topic.title),
      h('span', { class: 'topic-card__meta' },
        h('span', {}, t('n.questions', { n: stats.total })),
        stats.best !== null ? h('span', { class: 'topic-card__best' }, t('bestPct', { p: stats.best })) : null,
        stats.mistakes.length ? h('span', { class: 'topic-card__miss' }, t('n.mistakes', { n: stats.mistakes.length })) : null),
      h('span', { class: 'topic-card__progress' }, meter(stats.percent / 100, t('progressOf', { name: t('topicN', { n: topic.number }) })), h('span', { dir: 'ltr' }, `${stats.percent}%`))),
    h('span', { class: 'topic-card__go' }, forwardIcon()));
}

export async function showCourse(ctx, courseId) {
  const token = ctx.token;
  const summaries = await courseSummaries(ctx);
  if (token !== ctx.token) return;
  const summary = summaries.find((s) => s.course.id === courseId);
  const mistakes = summaries.reduce((n, c) => n + c.mistakes, 0);
  const { course, topics, totalQuestions, percent } = summary;
  const name = localName(course);

  mount(screen({
    bar: pagebar({ start: backLink(paths.courses(), t('course.back')), title: t('courses.title') }),
    body: [
      h('section', { class: 'card course-hero' },
        h('p', { class: 'course-hero__en', lang: name.mainLang }, name.main),
        name.sub ? h('p', { class: 'course-hero__ar', lang: name.subLang, dir: name.subLang === 'ar' ? 'rtl' : 'ltr' }, name.sub) : null,
        h('dl', { class: 'course-hero__stats' },
          h('div', {}, h('dt', {}, t('course.topics')), h('dd', {}, topics.length)),
          h('div', {}, h('dt', {}, t('course.questions')), h('dd', {}, totalQuestions)),
          h('div', {}, h('dt', {}, t('course.mastered')), h('dd', { dir: 'ltr' }, `${percent}%`)))),
      h('div', { class: 'section-head' }, h('h2', {}, t('course.topics'))),
      h('div', { class: 'card-grid' }, topics.map((x) => topicCard(course, x))),
    ],
    foot: tabbar('courses', { badge: mistakes }),
  }));
}
