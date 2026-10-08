// Page titles and descriptions for every route, in either language. Shared by the app (the browser tab
// title) and by tools/build-pages.mjs (the copy of each page that search engines and link previews read),
// so both always say the same thing.

import { t } from './i18n.js';
import { findCourse, findTopic, topicLabel } from './catalog.js';
import { PRIVACY } from './privacy-text.js';

const TYPES = ['mcq', 'tf', 'fib', 'matching'];

export const courseName = (course, language) => (language === 'ar' && course.titleAr) || course.titleEn;

const withBrand = (language, ...parts) => [...parts, t('brand', {}, language)].join(' | ');

/** Browser tab / search result title. Unknown course or topic ids fall back to "page not found". */
export function pageTitle(route, catalog, language) {
  const { name, params } = route;
  if (name === 'home') return t('meta.home', {}, language);
  if (name === 'courses') return withBrand(language, t('tab.courses', {}, language));
  if (name === 'review') return withBrand(language, t('tab.review', {}, language));
  if (name === 'privacy') return withBrand(language, PRIVACY[language].title);
  if (name === 'course') {
    const course = catalog && findCourse(catalog, params.course);
    if (course) return withBrand(language, language === 'ar' && course.titleAr ? `${course.titleAr} (${course.titleEn})` : course.titleEn);
  }
  if (name === 'topic') {
    const found = catalog && findTopic(catalog, params.course, params.topic);
    if (found) {
      const { course, topic } = found;
      return withBrand(language, `${topicLabel(topic, language)}: ${topic.title}`, courseName(course, language));
    }
  }
  return withBrand(language, t('nf.title', {}, language));
}

/** Search result / link preview description. `banks` maps a topic's bank path to its loaded bank. */
export function pageDescription(route, catalog, language, banks = new Map()) {
  const { name, params } = route;
  const count = (topic) => banks.get(topic.bank)?.questions.length ?? 0;
  if (name === 'courses') return t('meta.coursesDesc', {}, language);
  if (name === 'privacy') return t('meta.privacyDesc', {}, language);
  if (name === 'course') {
    const course = findCourse(catalog, params.course);
    if (course) {
      const questions = course.topics.filter((topic) => !topic.mix).reduce((n, topic) => n + count(topic), 0);
      return t('meta.courseDesc', {
        course: courseName(course, language),
        questions: t('n.questions', { n: questions }, language),
        topics: t('n.topics', { n: course.topics.length }, language),
      }, language);
    }
  }
  if (name === 'topic') {
    const found = findTopic(catalog, params.course, params.topic);
    if (found) {
      const { course, topic } = found;
      const qs = banks.get(topic.bank)?.questions ?? [];
      const types = TYPES.filter((type) => qs.some((q) => q.type === type)).map((type) => t(`type.${type}`, {}, language));
      return t('meta.topicDesc', {
        topic: topic.title,
        course: courseName(course, language),
        questions: t('n.questions', { n: qs.length }, language),
        types: types.join(language === 'ar' ? '، ' : ', '),
      }, language);
    }
  }
  return t('meta.homeDesc', {}, language);
}
