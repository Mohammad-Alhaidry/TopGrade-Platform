// App entry: loads the course catalog, routes URLs to screens, and registers the service worker
// that makes Smart Pro installable, instant to open and usable offline.

import { startRouter, currentRoute, setNavigationGuard, navigate } from './router.js';
import { loadCatalog, findCourse, findTopic, loadTopicBank } from './catalog.js';
import { openTopic, handlePop, allowNavigation, rerender, quizIdle } from './quiz.js';
import { showHome } from './views/home.js';
import { showCourses } from './views/courses.js';
import { showCourse } from './views/course.js';
import { showReview } from './views/review.js';
import { showPrivacy, showNotFound, showLoadError } from './views/pages.js';
import { registerServiceWorker, applyUpdateIfReady, onUpdateReady } from './update.js';
import { reportOpen, syncSubscription } from './notify.js';
import { initHeader, repaintHeader } from './shell.js';
import { applyLang, onLangChange } from './i18n.js';
import { initTheme, theme } from './theme.js';
import { track, describeSession } from './analytics.js';
import { lang } from './i18n.js';
import { currentPlatform } from './install.js';
import { pageTitle } from './meta.js';
import { loadMath } from './math.js';

// Screens where switching to a newly downloaded version (a reload) loses nothing.
const SAFE_TO_UPDATE = new Set(['home', 'courses', 'course', 'review', 'privacy', 'notfound']);

const DATA_URL = new URL('data/', document.baseURI).href;
const ctx = { catalog: null, dataUrl: DATA_URL, token: 0 };

/** A link to a course or topic this device's saved course list doesn't have yet (a course added since the app was
 *  last updated): ask the server for the current list before saying "not found", and fetch the new version. */
async function catalogKnows(route) {
  const known = () => (route.name === 'course' ? findCourse(ctx.catalog, route.params.course) : findTopic(ctx.catalog, route.params.course, route.params.topic));
  if (!['course', 'topic'].includes(route.name) || known()) return;
  try {
    ctx.catalog = await loadCatalog(new URL(`catalog.json?fresh=${Date.now()}`, DATA_URL).href);
    navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {});
  } catch {
    /* offline: keep the saved list */
  }
}

async function render(route) {
  const token = ++ctx.token;
  try {
    ctx.catalog ??= await loadCatalog(new URL('catalog.json', DATA_URL).href);
    await catalogKnows(route);
    if (token !== ctx.token) return;
    const { name, params } = route;
    if (name === 'moved') return navigate(params.to, { replace: true });
    document.title = pageTitle(route, ctx.catalog, lang());
    // Any move to another page leaves the current screen anyway: switch to a downloaded update now.
    if (applyUpdateIfReady()) return; // reloads into the new version
    if (name === 'home') return await showHome(ctx);
    if (name === 'courses') return await showCourses(ctx);
    if (name === 'review') return await showReview(ctx);
    if (name === 'privacy') return showPrivacy();
    if (name === 'course' && findCourse(ctx.catalog, params.course)) return await showCourse(ctx, params.course);
    if (name === 'topic') {
      const found = findTopic(ctx.catalog, params.course, params.topic);
      if (found) {
        const [bank] = await Promise.all([loadTopicBank(DATA_URL, found.topic), found.course.math ? loadMath() : null]);
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
  track('language_changed', { to: lang() });
  repaintHeader();
  if (ctx.catalog) document.title = pageTitle(currentRoute(), ctx.catalog, lang());
  if (!rerender()) render(currentRoute());
});

// A fresh page load starts on a clean history entry, even if it was reloaded mid-quiz.
if (history.state?.screen) history.replaceState(null, '');
setNavigationGuard(allowNavigation);
startRouter(render, handlePop);

// An update that finishes downloading while the student is on a safe screen is applied straight away.
// Safe = nothing on screen would be lost by a reload: any page but a quiz in progress (its question, results or
// answer review); a topic's setup screen is safe.
const safeToUpdate = () => SAFE_TO_UPDATE.has(currentRoute().name) || (currentRoute().name === 'topic' && quizIdle());
onUpdateReady(() => {
  if (safeToUpdate()) applyUpdateIfReady();
});
// An app brought back from the background (phones keep it open for days) takes a waiting update at once.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && safeToUpdate()) applyUpdateIfReady();
});
registerServiceWorker();
reportOpen();
syncSubscription();

describeSession({ language: lang(), theme: theme(), app: currentPlatform().installed ? 'installed' : 'browser' });
addEventListener('appinstalled', () => track('app_installed'));
