// Light / dark theme. The first paint already has the right theme (inline script in index.html);
// this module flips it and remembers the choice. Without a saved choice it follows the phone's setting.

const STORAGE_KEY = 'topgrade.theme';
const BAR = { light: '#FFFFFF', dark: '#0B1730' }; // browser/status bar colour per theme

export const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function paintBar() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme()]);
}

export function setTheme(next) {
  document.documentElement.dataset.theme = next;
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
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
      paintBar();
    }
  });
}
