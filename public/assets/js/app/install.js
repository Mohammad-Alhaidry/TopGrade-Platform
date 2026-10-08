// "Install the app" support.
// Android/desktop Chromium: the browser fires `beforeinstallprompt`; we keep it and show our own Install button.
// iPhone/iPad: there is no prompt, so we show the two Share-menu steps instead.
// Nothing is shown when the app already runs installed, or after the student dismisses it.

const DISMISS_KEY = 'topgrade.install.dismissed';
const DISMISS_DAYS = 30;

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

// Registered at startup (main.js imports this module first), before the browser fires the event.
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  notify();
});
addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

/** Pure platform detection from navigator-like values (unit-tested). */
export function detectPlatform({ userAgent = '', platform = '', maxTouchPoints = 0, standalone = false, displayStandalone = false } = {}) {
  // iPadOS 13+ reports itself as a Mac; touch support gives it away.
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
  return { ios, installed: Boolean(standalone || displayStandalone) };
}

export function currentPlatform() {
  return detectPlatform({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navigator.standalone === true,
    displayStandalone: matchMedia('(display-mode: standalone)').matches,
  });
}

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the card just comes back next time */
  }
  notify();
}

/** What to offer right now: 'prompt' (Install button), 'ios' (Share-menu steps) or null. */
export function installOffer() {
  const { ios, installed } = currentPlatform();
  if (installed || dismissedRecently()) return null;
  if (deferredPrompt) return 'prompt';
  if (ios) return 'ios';
  return null;
}

/** Shows the browser's install dialog. Resolves true when the student accepted. */
export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  notify();
  return outcome === 'accepted';
}

/** Re-render hook for when an offer appears (late prompt event) or goes away. Returns an unsubscribe. */
export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
