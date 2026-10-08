// Course list, plus the per-course summaries the home page reuses.

import { h } from '../../quiz/dom.js';
import { pagebar, screen, tabbar, mount, meter, forwardIcon } from '../shell.js';
import { href } from '../router.js';
import { paths } from '../routes.js';
import { readProgress, topicStats } from '../progress.js';
import { loadTopicBank, topicKey } from '../catalog.js';
import { t, localName } from '../i18n.js';

/** For every course: its topics with loaded banks and the student's stats. */
export async function courseSummaries(ctx) {
  const progress = readProgress();
  return Promise.all(ctx.catalog.courses.map(async (course) => {
    const topics = await Promise.all(course.topics.map(async (topic) => {
      const bank = await loadTopicBank(ctx.dataUrl, topic);
      const stats = topicStats(progress, topicKey(course, topic), bank.questions.map((q) => q.id));
      return { topic, bank, stats };
    }));
    const totalQuestions = topics.reduce((n, x) => n + x.stats.total, 0);
    const mastered = topics.reduce((n, x) => n + x.stats.mastered, 0);
    return {
      course,
      topics,
      totalQuestions,
      mastered,
      percent: totalQuestions ? Math.round((mastered / totalQuestions) * 100) : 0,
      mistakes: topics.reduce((n, x) => n + x.stats.mistakes.length, 0),
    };
  }));
}

/** Monogram from the English title, e.g. "Problem Solving & Programming" -> "PS". */
const monogram = (title) => title.split(/[^A-Za-z]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export function courseCard({ course, topics, totalQuestions, percent }) {
  const name = localName(course);
  return h('a', { class: 'card course-card', href: href(paths.course(course.id)) },
    h('span', { class: 'course-card__mono', 'aria-hidden': 'true', lang: 'en' }, monogram(course.titleEn)),
    h('span', { class: 'course-card__copy' },
      h('span', { class: 'course-card__en', lang: name.mainLang }, name.main),
      name.sub ? h('span', { class: 'course-card__ar', lang: name.subLang, dir: name.subLang === 'ar' ? 'rtl' : 'ltr' }, name.sub) : null,
      h('span', { class: 'course-card__meta' }, `${t('n.topics', { n: topics.length })} · ${t('n.questions', { n: totalQuestions })}`),
      h('span', { class: 'course-card__progress' }, meter(percent / 100, t('progressOf', { name: name.main })), h('span', { dir: 'ltr' }, `${percent}%`))),
    h('span', { class: 'course-card__go' }, forwardIcon()));
}

export async function showCourses(ctx) {
  const token = ctx.token;
  const summaries = await courseSummaries(ctx);
  if (token !== ctx.token) return;
  const mistakes = summaries.reduce((n, c) => n + c.mistakes, 0);
  mount(screen({
    bar: pagebar({ title: t('courses.title'), end: h('span', { class: 'pagebar__meta' }, t('n.courses', { n: summaries.length })) }),
    body: h('div', { class: 'card-grid' }, summaries.map(courseCard)),
    foot: tabbar('courses', { badge: mistakes }),
  }));
}
