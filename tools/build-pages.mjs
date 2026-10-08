#!/usr/bin/env node
// Build step (part of `npm run build`): the files search engines, link previews and security scanners read.
//  - public/pages/<route>.html  a copy of index.html per app address, with that page's own title, description,
//    canonical link, structured data (JSON-LD) and readable Arabic content. nginx serves it for the address;
//    the app then starts as usual and replaces the content, so students see no difference.
//  - public/robots.txt, public/sitemap.xml, public/.well-known/security.txt
// The tests fail if these are out of date, and tg-app-deploy refuses to publish then.
//
//   node tools/build-pages.mjs          write the files
//   node tools/build-pages.mjs --check  exit 1 if any is out of date

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, SECURITY_TXT_EXPIRES } from './site.mjs';
import { pageTitle, pageDescription, courseName } from '../public/assets/js/app/meta.js';
import { t } from '../public/assets/js/app/i18n.js';
import { PRIVACY } from '../public/assets/js/app/privacy-text.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const LANG = 'ar'; // the app's default language, and what a first-time visitor (or a crawler) sees
const TYPES = ['mcq', 'tf', 'fib', 'matching'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ar = (key, vars) => t(key, vars, LANG);
const url = (path) => `${SITE}/${path}`;
const brand = { '@type': 'EducationalOrganization', name: 'Smart Pro', alternateName: 'سمارت برو', url: url('') };

function load() {
  const catalog = JSON.parse(readFileSync(join(PUBLIC, 'data/catalog.json'), 'utf8'));
  const banks = new Map();
  for (const course of catalog.courses) {
    for (const topic of course.topics) banks.set(topic.bank, JSON.parse(readFileSync(join(PUBLIC, 'data', topic.bank), 'utf8')));
  }
  return { catalog, banks };
}

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(path) })),
});
const crumbs = (items) => h('nav', { 'aria-label': 'breadcrumb' }, items.map(([name, path], i) => (i < items.length - 1 ? `<a href="${path || './'}">${esc(name)}</a> / ` : esc(name))).join(''));

// Tiny HTML helper: attributes are escaped, children are already-safe HTML strings.
function h(tag, attrs, ...children) {
  const a = Object.entries(attrs ?? {}).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  return `<${tag}${a}>${children.flat().join('')}</${tag}>`;
}

/** Every indexable address with its content and structured data. */
function pages({ catalog, banks }) {
  const home = ['سمارت برو', ''];
  const coursesCrumb = [ar('tab.courses'), 'courses'];
  const count = (topic) => banks.get(topic.bank).questions.length;
  const courseLine = (course) => {
    const total = course.topics.reduce((n, topic) => n + count(topic), 0);
    return h('li', {}, `<a href="courses/${course.id}">${esc(courseName(course, LANG))} (${esc(course.titleEn)})</a>: `,
      esc(`${ar('n.questions', { n: total })} في ${ar('n.topics', { n: course.topics.length })}`));
  };
  const out = [];

  out.push({
    path: '', route: { name: 'home', params: {} },
    body: [h('h1', {}, 'سمارت برو'), h('p', {}, esc(ar('meta.homeDesc'))),
      h('h2', {}, esc(ar('tab.courses'))), h('ul', {}, catalog.courses.map(courseLine)),
      h('p', {}, `<a href="privacy">${esc(PRIVACY.ar.title)}</a>`)],
    data: [{ '@type': 'WebSite', name: 'Smart Pro', alternateName: 'سمارت برو', url: url(''), inLanguage: ['ar', 'en'] },
      { ...brand, logo: url('assets/icons/icon-512.png') }],
  });

  out.push({
    path: 'courses', route: { name: 'courses', params: {} },
    body: [crumbs([home, coursesCrumb]), h('h1', {}, esc(ar('tab.courses'))), h('p', {}, esc(ar('meta.coursesDesc'))), h('ul', {}, catalog.courses.map(courseLine))],
    data: [breadcrumb([home, coursesCrumb]),
      { '@type': 'ItemList', itemListElement: catalog.courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: url(`courses/${c.id}`), name: c.titleEn })) }],
  });

  for (const course of catalog.courses) {
    const coursePath = `courses/${course.id}`;
    const courseCrumb = [courseName(course, LANG), coursePath];
    const route = { name: 'course', params: { course: course.id } };
    const description = pageDescription(route, catalog, LANG, banks);
    out.push({
      path: coursePath, route,
      body: [crumbs([home, coursesCrumb, courseCrumb]), h('h1', {}, esc(courseName(course, LANG))), h('p', { lang: 'en', dir: 'ltr' }, esc(course.titleEn)),
        h('p', {}, esc(description)), h('h2', {}, 'المواضيع'),
        h('ol', {}, course.topics.map((topic) => h('li', {}, `<a href="${coursePath}/${topic.id}">${esc(ar('topicN', { n: topic.number }))}: <span lang="en" dir="ltr">${esc(topic.title)}</span></a> (${esc(ar('n.questions', { n: count(topic) }))})`)))],
      data: [breadcrumb([home, coursesCrumb, courseCrumb]),
        { '@type': 'Course', name: course.titleEn, alternateName: course.titleAr, description, url: url(coursePath), inLanguage: 'en', educationalLevel: 'University', provider: brand,
          hasPart: course.topics.map((topic) => ({ '@type': 'Quiz', name: topic.title, url: url(`${coursePath}/${topic.id}`) })) }],
    });

    for (const topic of course.topics) {
      const path = `${coursePath}/${topic.id}`;
      const topicRoute = { name: 'topic', params: { course: course.id, topic: topic.id } };
      const desc = pageDescription(topicRoute, catalog, LANG, banks);
      const qs = banks.get(topic.bank).questions;
      const topicCrumb = [ar('topicN', { n: topic.number }), path];
      out.push({
        path, route: topicRoute,
        body: [crumbs([home, coursesCrumb, courseCrumb, topicCrumb]), h('h1', {}, `${esc(ar('topicN', { n: topic.number }))}: <span lang="en" dir="ltr">${esc(topic.title)}</span>`),
          h('p', {}, `<a href="${coursePath}">${esc(courseName(course, LANG))}</a>`), h('p', {}, esc(desc)),
          h('h2', {}, 'أنواع الأسئلة'),
          h('ul', {}, TYPES.filter((type) => qs.some((q) => q.type === type)).map((type) => h('li', {}, esc(`${ar(`type.${type}`)}: ${ar('n.questions', { n: qs.filter((q) => q.type === type).length })}`))))],
        data: [breadcrumb([home, coursesCrumb, courseCrumb, topicCrumb]),
          { '@type': 'Quiz', name: topic.title, description: desc, url: url(path), inLanguage: 'en', educationalLevel: 'University', provider: brand,
            isPartOf: { '@type': 'Course', name: course.titleEn, url: url(coursePath) } }],
      });
    }
  }

  const p = PRIVACY.ar;
  out.push({
    path: 'privacy', route: { name: 'privacy', params: {} },
    body: [crumbs([home, [p.title, 'privacy']]), h('h1', {}, esc(p.title)), h('p', {}, esc(p.updated)),
      p.sections.map(([title, text]) => h('h2', {}, esc(title)) + h('p', {}, esc(text))),
      h('h2', {}, esc(p.contact[0])), h('p', {}, esc(p.contact[1]), `<a href="./">${esc(p.contact[2])}</a>`, esc(p.contact[3]))],
    data: [breadcrumb([home, [p.title, 'privacy']])],
  });

  // Personal (a student's own mistakes): reachable, but kept out of search results.
  out.push({
    path: 'review', route: { name: 'review', params: {} }, noindex: true,
    body: [h('h1', {}, esc(ar('tab.review'))), h('p', {}, `<a href="courses">${esc(ar('tab.courses'))}</a>`)],
    data: [],
  });
  return out;
}

function render(template, page, ctx) {
  const title = pageTitle(page.route, ctx.catalog, LANG);
  const description = pageDescription(page.route, ctx.catalog, LANG, ctx.banks);
  const meta = [
    `<link rel="canonical" href="${esc(url(page.path))}">`,
    `<meta property="og:url" content="${esc(url(page.path))}">`,
    '<meta property="og:locale" content="ar_SA">',
    '<meta property="og:locale:alternate" content="en_US">',
    page.noindex ? '<meta name="robots" content="noindex">' : '',
    page.data.length
      ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': page.data }).replace(/</g, '\\u003c')}</script>`
      : '',
  ].filter(Boolean).join('\n');
  const swap = (html, re, value) => {
    if (!re.test(html)) throw new Error(`index.html is missing ${re}`);
    return html.replace(re, value);
  };
  let html = template;
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = swap(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`);
  html = swap(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`);
  html = swap(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`);
  html = swap(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(url('assets/icons/og-image.png'))}">`);
  html = swap(html, /<!-- BEGIN PAGE META -->[\s\S]*?<!-- END PAGE META -->/, `<!-- BEGIN PAGE META -->\n${meta}\n<!-- END PAGE META -->`);
  html = swap(html, /<!-- BEGIN PAGE CONTENT -->[\s\S]*?<!-- END PAGE CONTENT -->/,
    `<!-- BEGIN PAGE CONTENT -->\n<main class="page-copy">\n${page.body.flat().join('\n')}\n</main>\n<!-- END PAGE CONTENT -->`);
  return html;
}

/** Every generated file, as { 'relative/path': contents }. */
export function generated() {
  const ctx = load();
  const template = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
  const list = pages(ctx);
  const files = {};
  for (const page of list) files[`pages/${page.path || 'index'}.html`] = render(template, page, ctx);
  files['sitemap.xml'] = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...list.filter((p) => !p.noindex).map((p) => `  <url><loc>${esc(url(p.path))}</loc></url>`), '</urlset>', ''].join('\n');
  // /review is not blocked here: crawlers must be able to read its noindex tag.
  files['robots.txt'] = ['User-agent: *', 'Allow: /', 'Disallow: /preview/', 'Disallow: /whatsapp', '', `Sitemap: ${url('sitemap.xml')}`, ''].join('\n');
  // Contact: the home page, where the «راسلنا» button is (the number itself stays only on that button).
  files['.well-known/security.txt'] = [`Contact: ${url('')}`, `Expires: ${SECURITY_TXT_EXPIRES}`, 'Preferred-Languages: ar, en',
    `Canonical: ${url('.well-known/security.txt')}`, ''].join('\n');
  return files;
}

function existingPages() {
  const dir = join(PUBLIC, 'pages');
  if (!existsSync(dir)) return [];
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  return walk(dir).map((f) => relative(PUBLIC, f).split(sep).join('/'));
}

export function isCurrent() {
  const files = generated();
  const stale = existingPages().filter((f) => !(f in files));
  return !stale.length && Object.entries(files).every(([f, body]) => existsSync(join(PUBLIC, f)) && readFileSync(join(PUBLIC, f), 'utf8') === body);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--check')) {
    if (!isCurrent()) {
      console.error('Search-engine pages, sitemap, robots.txt or security.txt are out of date. Run: npm run build');
      process.exit(1);
    }
    console.log('Search-engine files are up to date');
  } else {
    rmSync(join(PUBLIC, 'pages'), { recursive: true, force: true });
    const files = generated();
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(dirname(join(PUBLIC, f)), { recursive: true });
      writeFileSync(join(PUBLIC, f), body);
    }
    console.log(`Wrote ${Object.keys(files).length} search-engine files`);
  }
}
