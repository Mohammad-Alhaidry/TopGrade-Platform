// Service worker registration and app updates.
// The worker serves the app from the device's cache, so it opens instantly and offline. A new deploy
// installs in the background ("waiting"); we switch to it only on screens where a reload loses nothing
// (home, course lists, review), so a student is never interrupted mid-quiz.

let waitingWorker = null;
let swapping = false;

function track(worker) {
  if (!worker) return;
  const note = () => {
    // "installed" with an existing controller = an update is ready (not the very first install).
    if (worker.state === 'installed' && navigator.serviceWorker.controller) waitingWorker = worker;
  };
  note();
  worker.addEventListener('statechange', note);
}

export function registerServiceWorker() {
  // Service workers need HTTPS (or localhost). Scope = the app's base path, so /preview/ stays separate.
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href).then((reg) => {
    track(reg.waiting);
    track(reg.installing);
    reg.addEventListener('updatefound', () => track(reg.installing));
    // Installed apps can stay open for days: check for a new version whenever they come back to the front.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch((err) => console.warn('Offline support unavailable:', err));

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!swapping) return; // first install also changes controller; only reload for updates we asked for
    swapping = false;
    location.reload();
  });
}

/** Switches to a downloaded update, if any. Call only where a reload loses nothing. */
export function applyUpdateIfReady() {
  if (!waitingWorker) return false;
  swapping = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  waitingWorker = null;
  return true;
}
