// Light / dark theme. The first paint already has the right theme (inline script in index.html);
// this module flips it and remembers the choice. Without a saved choice it follows the phone's setting.

const STORAGE_KEY = 'topgrade.theme';
const BAR = { light: '#FFFFFF', dark: '#0E1513' }; // browser/status bar colour per theme (the header's --card)

export const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function paintBar() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme()]);
}

// Switch every colour in one frame: with transitions running, buttons and cards would each fade at their own
// pace and the page would shimmer through mixed colours.
function switchTo(next) {
  const root = document.documentElement;
  root.classList.add('theme-switch');
  root.dataset.theme = next;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switch')));
}

export function setTheme(next) {
  switchTo(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable: the choice lasts until the page closes */
  }
  paintBar();
}

export const toggleTheme = () => setTheme(theme() === 'dark' ? 'light' : 'dark');

export function initTheme() {
  paintBar();
  // Follow the phone's setting live until the student picks a theme themselves.
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!saved) {
      switchTo(e.matches ? 'dark' : 'light');
      paintBar();
    }
  });
}
