// Clean-URL navigation on the History API. The app can live under a sub-path (e.g. /preview/);
// <base href> in index.html says where, and every link is built relative to it.

import { matchRoute } from './routes.js';

export const BASE = new URL(document.baseURI).pathname.replace(/\/?$/, '/');

/** Absolute path for an app path, e.g. href('courses') -> '/courses' (or '/preview/courses'). */
export const href = (path = '') => BASE + path.replace(/^\/+/, '');

export function currentRoute() {
  const p = location.pathname;
  return matchRoute(p.startsWith(BASE) ? p.slice(BASE.length) : p);
}

let onChange = () => {};
let onPop = () => false;
let guard = null;

/** guard(path) returns false to stop a link navigation (e.g. the quiz asks before leaving). */
export const setNavigationGuard = (fn) => { guard = fn; };

/**
 * render: called with the matched route after every navigation.
 * popGuard: called on Back first; return true if it handled the event (e.g. the quiz asking before leaving).
 */
export function startRouter(render, popGuard) {
  onChange = render;
  onPop = popGuard;
  addEventListener('popstate', (e) => {
    if (!onPop(e)) onChange(currentRoute());
  });
  // Same-app links navigate without a page load.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || a.hasAttribute('download')) return;
    e.preventDefault();
    const path = url.pathname.slice(BASE.length);
    if (guard && !guard(path)) return;
    navigate(path);
  });
  onChange(currentRoute());
}

export function navigate(path, { replace = false } = {}) {
  const url = href(path);
  if (replace) history.replaceState(null, '', url);
  else if (url !== location.pathname) history.pushState(null, '', url);
  onChange(currentRoute());
}
