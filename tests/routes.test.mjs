import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRoute, paths } from '../public/assets/js/app/routes.js';

test('matchRoute maps clean URLs to screens', () => {
  assert.deepEqual(matchRoute(''), { name: 'home', params: {} });
  assert.deepEqual(matchRoute('/index.html'), { name: 'home', params: {} });
  assert.deepEqual(matchRoute('courses'), { name: 'courses', params: {} });
  assert.deepEqual(matchRoute('courses/problem-solving/'), { name: 'course', params: { course: 'problem-solving' } });
  assert.deepEqual(matchRoute('courses/problem-solving/topic-1'), { name: 'topic', params: { course: 'problem-solving', topic: 'topic-1' } });
  assert.deepEqual(matchRoute('review'), { name: 'review', params: {} });
  assert.deepEqual(matchRoute('privacy'), { name: 'privacy', params: {} });
});

test('matchRoute rejects unknown or malformed paths', () => {
  for (const p of ['nope', 'courses/a/b/c', 'courses/Bad%20Id', 'review/x', 'courses/../etc']) {
    assert.equal(matchRoute(p).name, 'notfound', p);
  }
});

test('paths round-trip through matchRoute', () => {
  assert.equal(matchRoute(paths.topic('c', 't')).name, 'topic');
  assert.equal(matchRoute(paths.course('c')).name, 'course');
  assert.equal(matchRoute(paths.home()).name, 'home');
});

test('moved addresses map to their new place (installed apps never reach the nginx redirect)', () => {
  assert.deepEqual(matchRoute('quiz.html'), { name: 'moved', params: { to: 'courses/problem-solving/topic-1' } });
  assert.equal(matchRoute(matchRoute('/quiz.html').params.to).name, 'topic');
});
