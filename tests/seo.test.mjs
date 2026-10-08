import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCurrent, generated } from '../tools/build-pages.mjs';
import { SITE, SECURITY_TXT_EXPIRES } from '../tools/site.mjs';
import { pageTitle } from '../public/assets/js/app/meta.js';

const pub = new URL('../public/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('data/catalog.json', pub)));
const files = generated();
const ld = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('search-engine pages, sitemap, robots.txt and security.txt are up to date (run `npm run build`)', () => {
  assert.ok(isCurrent());
});

test('every course and topic has its own page with matching title, canonical link and structured data', () => {
  const sitemap = files['sitemap.xml'];
  for (const course of catalog.courses) {
    for (const [path, route] of [
      [`courses/${course.id}`, { name: 'course', params: { course: course.id } }],
      ...course.topics.map((topic) => [`courses/${course.id}/${topic.id}`, { name: 'topic', params: { course: course.id, topic: topic.id } }]),
    ]) {
      const html = files[`pages/${path}.html`];
      assert.ok(html, `${path} has no page`);
      assert.ok(html.includes(`<title>${pageTitle(route, catalog, 'ar').replace(/&/g, '&amp;')}</title>`), `${path} title`);
      assert.ok(html.includes(`<link rel="canonical" href="${SITE}/${path}">`), `${path} canonical`);
      assert.ok(sitemap.includes(`<loc>${SITE}/${path}</loc>`), `${path} missing from sitemap`);
      assert.ok(ld(html)['@graph'].length >= 2, `${path} structured data`);
    }
  }
});

test('the personal review page stays out of search results but robots.txt lets crawlers see that', () => {
  assert.match(files['pages/review.html'], /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(files['sitemap.xml'], /\/review</);
  assert.doesNotMatch(files['robots.txt'], /Disallow: \/review/);
  assert.match(files['robots.txt'], /Disallow: \/preview\//);
  assert.match(files['robots.txt'], new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
});

test('security.txt has a contact and does not expire within 30 days', () => {
  assert.match(files['.well-known/security.txt'], /^Contact: https:\/\//m);
  assert.ok(new Date(SECURITY_TXT_EXPIRES) - Date.now() > 30 * 864e5, 'security.txt expires soon: update SECURITY_TXT_EXPIRES in tools/site.mjs');
});

test('pages carry no inline script or style, so the Content-Security-Policy can forbid them', () => {
  for (const [name, html] of [['index.html', readFileSync(new URL('index.html', pub), 'utf8')], ...Object.entries(files).filter(([f]) => f.endsWith('.html'))]) {
    assert.doesNotMatch(html, /<style/, `${name} has a <style> block`);
    assert.doesNotMatch(html, /\sstyle="/, `${name} has a style attribute`);
    for (const tag of html.match(/<script\b[^>]*>/g)) {
      assert.ok(/\ssrc="/.test(tag) || /type="application\/ld\+json"/.test(tag), `${name}: inline script ${tag}`);
    }
  }
});
