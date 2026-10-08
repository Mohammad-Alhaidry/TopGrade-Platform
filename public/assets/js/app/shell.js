// Building blocks shared by every screen.
// The top header is built once and never re-rendered: theme switch, logo, language switch.
// Each screen below it can add a page bar (back/close, title, page actions) and a footer.

import { h, icon, ICONS } from '../quiz/dom.js';
import { href } from './router.js';
import { paths } from './routes.js';
import { t, lang, setLang, isRTL } from './i18n.js';
import { theme, toggleTheme } from './theme.js';
import { track } from './analytics.js';

export const WHATSAPP_URL = 'https://wa.me/message/QSPQR7JSSNKUJ1?src=qr';

const root = document.getElementById('app');
let keyHandler = null;

addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
  keyHandler?.(e);
});

/**
 * Shows a screen. focus: element or selector to focus (defaults to [data-autofocus]);
 * onKey: keyboard handler while this screen is shown; scrollTo: element to bring into view.
 */
export function mount(screenEl, { focus, onKey = null, scrollTo = null } = {}) {
  keyHandler = onKey;
  root.replaceChildren(screenEl);
  const body = screenEl.querySelector('.body');
  if (body) body.scrollTop = 0;
  scrollTo?.scrollIntoView({ block: 'start' });
  const target = typeof focus === 'string' ? screenEl.querySelector(focus) : focus ?? screenEl.querySelector('[data-autofocus]');
  target?.focus({ preventScroll: true });
}

/* ---------- Fixed top header ---------- */

let headerParts = null;

function paintHeader() {
  const { themeBtn, langBtn, brand } = headerParts;
  const dark = theme() === 'dark';
  themeBtn.replaceChildren(icon(...(dark ? ICONS.sun : ICONS.moon)));
  themeBtn.setAttribute('aria-label', t(dark ? 'hdr.light' : 'hdr.dark'));
  langBtn.textContent = t('hdr.langShort');
  langBtn.setAttribute('aria-label', t('hdr.lang'));
  langBtn.setAttribute('lang', lang() === 'ar' ? 'en' : 'ar');
  brand.setAttribute('aria-label', t('hdr.home'));
}

/** Builds the header once. Call repaintHeader() after a language or theme change. */
export function initHeader(container) {
  const themeBtn = h('button', { type: 'button', class: 'hdr__btn', onclick: () => { toggleTheme(); paintHeader(); track('theme_changed', { to: theme() }); } });
  const langBtn = h('button', { type: 'button', class: 'hdr__btn hdr__btn--lang', onclick: () => setLang(lang() === 'ar' ? 'en' : 'ar') });
  const brand = h('a', { class: 'hdr__brand', href: href(paths.home()) },
    h('img', { src: 'assets/img/logo-mark.png', width: '160', height: '160', alt: 'Smart Pro' }));
  headerParts = { themeBtn, langBtn, brand };
  container.replaceChildren(h('div', { class: 'hdr__side' }, themeBtn), brand, h('div', { class: 'hdr__side hdr__side--end' }, langBtn));
  paintHeader();
}

export const repaintHeader = () => headerParts && paintHeader();

/* ---------- Page bar and controls ---------- */

/** Chevron that points "back" in the reading direction. */
export const backIcon = () => icon(...(isRTL() ? ICONS.chevronRight : ICONS.chevronLeft));
export const forwardIcon = () => icon(...(isRTL() ? ICONS.chevronLeft : ICONS.chevronRight));

export const iconButton = (iconNode, label, onclick) =>
  h('button', { type: 'button', class: 'iconbtn', 'aria-label': label, onclick }, iconNode);

export const backLink = (path, label) =>
  h('a', { class: 'iconbtn', href: href(path), 'aria-label': label }, backIcon());

/** Row under the header: optional start control, title (with optional subtitle), optional end content. */
export function pagebar({ start = null, title, sub = null, end = null, meter = null }) {
  return h('div', { class: 'pagebar' },
    h('div', { class: 'pagebar__row' },
      start ? h('div', { class: 'pagebar__start' }, start) : null,
      h('div', { class: 'pagebar__title' },
        h('h1', { tabindex: '-1', 'data-autofocus': true }, title),
        sub ? h('p', {}, sub) : null),
      end ? h('div', { class: 'pagebar__end' }, end) : null),
    meter);
}

const TABS = [
  { id: 'home', key: 'tab.home', path: paths.home(), icon: ICONS.home },
  { id: 'courses', key: 'tab.courses', path: paths.courses(), icon: ICONS.book },
  { id: 'review', key: 'tab.review', path: paths.review(), icon: ICONS.retry },
];

/** Bottom navigation like a native app. badge: number shown on the Review tab. */
export function tabbar(active, { badge = 0 } = {}) {
  return h('nav', { class: 'tabbar', 'aria-label': t('nav.main') },
    TABS.map((tab) =>
      h('a', { class: `tab${tab.id === active ? ' is-active' : ''}`, href: href(tab.path), 'aria-current': tab.id === active ? 'page' : null },
        h('span', { class: 'tab__icon' }, icon(...tab.icon),
          tab.id === 'review' && badge ? h('span', { class: 'tab__badge', 'aria-label': t('tab.badge', { n: badge }) }, badge > 99 ? '99+' : String(badge)) : null),
        h('span', { class: 'tab__label' }, t(tab.key)))));
}

/** A full-height screen: optional page bar, scrolling body, optional footer (action bar or tab bar). */
export function screen({ bar = null, body, foot = null, className = '' }) {
  return h('div', { class: `screen ${className}`.trim() }, bar, h('main', { class: 'body' }, body), foot);
}

/** Small horizontal progress bar. */
export function meter(fraction, label) {
  return h('div', { class: 'meter', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(fraction * 100)) },
    h('span', { style: `transform:scaleX(${Math.max(0, Math.min(1, fraction))})` }));
}

/** English content (questions, answers) inside an Arabic interface keeps its own direction and font. */
export const enText = (attrs = {}) => ({ ...attrs, lang: 'en', dir: 'ltr' });
