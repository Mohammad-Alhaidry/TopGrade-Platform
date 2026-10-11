// "Install the app" support.
// Android/desktop Chromium: the browser fires `beforeinstallprompt`; we keep it and show our own Install button.
// iPhone/iPad: there is no prompt, so we show the Add to Home Screen steps for the student's browser instead.
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

/**
 * Which "Add to Home Screen" steps fit this iPhone/iPad browser (unit-tested):
 * 'safari26' Safari on iOS 26+ (Share sits behind the ⋯ button next to the address bar),
 * 'safari' older Safari (Share in the bottom bar), 'ipad' (Share in the top bar), 'chrome' (Share in the address bar),
 * 'other' any other browser (open the page in Safari first).
 */
export function iosBrowser(userAgent = '', { ipad = false } = {}) {
  if (/CriOS/.test(userAgent)) return 'chrome';
  if (/FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Snapchat|TikTok|musical_ly|Line\//.test(userAgent)) return 'other';
  if (ipad || /iPad/.test(userAgent)) return 'ipad';
  // Safari 26 keeps reporting iOS 18_6 in the OS part, so the Safari version decides.
  const version = Number(/Version\/(\d+)/.exec(userAgent)?.[1] ?? 0);
  return version >= 26 ? 'safari26' : 'safari';
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
