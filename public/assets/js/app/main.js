// App entry: loads the course catalog, routes URLs to screens, and registers the service worker
// that makes TopGrade installable, instant to open and usable offline.

import { startRouter, currentRoute, setNavigationGuard } from './router.js';
import { loadCatalog, findCourse, findTopic, loadTopicBank } from './catalog.js';
import { openTopic, handlePop, allowNavigation, rerender } from './quiz.js';
import { showHome } from './views/home.js';
import { showCourses } from './views/courses.js';
import { showCourse } from './views/course.js';
import { showReview } from './views/review.js';
import { showPrivacy, showNotFound, showLoadError } from './views/pages.js';
import { registerServiceWorker, applyUpdateIfReady } from './update.js';
import { initHeader, repaintHeader } from './shell.js';
import { applyLang, onLangChange } from './i18n.js';
import { initTheme } from './theme.js';

// Screens where switching to a newly downloaded version (a reload) loses nothing.
const SAFE_TO_UPDATE = new Set(['home', 'courses', 'course', 'review', 'privacy', 'notfound']);

const DATA_URL = new URL('data/', document.baseURI).href;
const ctx = { catalog: null, dataUrl: DATA_URL, token: 0 };

async function render(route) {
  const token = ++ctx.token;
  try {
    ctx.catalog ??= await loadCatalog(new URL('catalog.json', DATA_URL).href);
    if (token !== ctx.token) return;
    const { name, params } = route;
    if (SAFE_TO_UPDATE.has(name) && applyUpdateIfReady()) return; // reloads into the new version
    if (name === 'home') return await showHome(ctx);
    if (name === 'courses') return await showCourses(ctx);
    if (name === 'review') return await showReview(ctx);
    if (name === 'privacy') return showPrivacy();
    if (name === 'course' && findCourse(ctx.catalog, params.course)) return await showCourse(ctx, params.course);
    if (name === 'topic') {
      const found = findTopic(ctx.catalog, params.course, params.topic);
      if (found) {
        const bank = await loadTopicBank(DATA_URL, found.topic);
        if (token === ctx.token) openTopic({ ...found, bank });
        return;
      }
    }
    showNotFound();
  } catch (err) {
    console.error(err);
    if (token === ctx.token) showLoadError(() => render(route));
  }
}

// The header is built once and stays put; screens render below it.
applyLang();
initTheme();
initHeader(document.getElementById('hdr'));

// Switching language redraws the current screen in place (a quiz keeps its answers and position).
onLangChange(() => {
  repaintHeader();
  if (!rerender()) render(currentRoute());
});

// A fresh page load starts on a clean history entry, even if it was reloaded mid-quiz.
if (history.state?.screen) history.replaceState(null, '');
setNavigationGuard(allowNavigation);
startRouter(render, handlePop);

registerServiceWorker();
