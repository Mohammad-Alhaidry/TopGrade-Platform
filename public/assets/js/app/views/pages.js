// Static pages: privacy policy (required for the Play Store listing), not found, load error.

import { h, icon, ICONS } from '../../quiz/dom.js';
import { pagebar, screen, mount, backLink } from '../shell.js';
import { href } from '../router.js';
import { paths } from '../routes.js';
import { t, lang } from '../i18n.js';
import { PRIVACY } from '../privacy-text.js';

export function showPrivacy() {
  const p = PRIVACY[lang()];
  const body = (text) => (Array.isArray(text)
    ? h('ul', { class: 'prose__list' }, text.map(([label, item]) => h('li', {}, h('strong', {}, label), ': ', item)))
    : h('p', {}, text));
  const section = ([title, text]) => h('section', { class: 'prose__section' }, h('h2', {}, title), body(text));
  const [cTitle, cText, cLink, cEnd] = p.contact;
  mount(screen({
    bar: pagebar({ start: backLink(paths.home(), t('priv.back')), title: p.title }),
    body: h('article', { class: 'card prose' },
      h('p', { class: 'prose__meta' }, p.updated),
      h('p', { class: 'prose__intro' }, p.intro),
      p.sections.map(section),
      h('section', { class: 'prose__section' },
        h('h2', {}, cTitle),
        h('p', {}, cText, h('a', { href: href(paths.home()) }, cLink), cEnd))),
  }));
}

export function showNotFound() {
  mount(screen({
    body: h('section', { class: 'card empty' },
      h('span', { class: 'empty__icon' }, icon(...ICONS.book)),
      h('h1', { tabindex: '-1', 'data-autofocus': true }, t('nf.title')),
      h('p', {}, t('nf.text')),
      h('a', { class: 'btn btn--primary', href: href(paths.courses()) }, t('browseCourses'))),
  }));
}

export function showLoadError(retry) {
  mount(screen({
    body: h('section', { class: 'card empty', role: 'alert' },
      h('span', { class: 'empty__icon' }, icon(...ICONS.cross)),
      h('h1', { tabindex: '-1', 'data-autofocus': true }, t('err.title')),
      h('p', {}, t('err.text')),
      h('button', { type: 'button', class: 'btn btn--primary', onclick: retry }, t('err.retry'))),
  }));
}
