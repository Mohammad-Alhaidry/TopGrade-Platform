// URL paths the app understands (relative to the app's base path). Pure, so it is unit-tested.
//   ''                       home
//   courses                  course list
//   courses/:course          one course and its topics
//   courses/:course/:topic   a topic: quiz setup, questions, results
//   review                   mistakes to review
//   privacy                  privacy policy

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function matchRoute(path) {
  const parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'index.html')) return { name: 'home', params: {} };
  if (!parts.every((p) => SEGMENT.test(p))) return { name: 'notfound', params: {} };
  const [first, course, topic, ...rest] = parts;
  if (rest.length) return { name: 'notfound', params: {} };
  if (first === 'courses' && !course) return { name: 'courses', params: {} };
  if (first === 'courses' && !topic) return { name: 'course', params: { course } };
  if (first === 'courses') return { name: 'topic', params: { course, topic } };
  if (first === 'review' && !course) return { name: 'review', params: {} };
  if (first === 'privacy' && !course) return { name: 'privacy', params: {} };
  return { name: 'notfound', params: {} };
}

export const paths = {
  home: () => '',
  courses: () => 'courses',
  course: (courseId) => `courses/${courseId}`,
  topic: (courseId, topicId) => `courses/${courseId}/${topicId}`,
  review: () => 'review',
  privacy: () => 'privacy',
};
