// Loaded as a plain (blocking) script in <head>, so it runs before first paint: saved theme and language, and whether we were opened as the installed app
// (start_url carries ?source=app), so the page never shows its own logo on top of the system launch screen.
(function () {
  var d = document.documentElement;
  try {
    // Arabic unless the student chose English (matches DEFAULT_LANG in i18n.js).
    if (localStorage.getItem('topgrade.lang') === 'en') { d.lang = 'en'; d.dir = 'ltr'; }
    var theme = localStorage.getItem('topgrade.theme');
    d.dataset.theme = theme === 'dark' || theme === 'light' ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) { d.dataset.theme = 'light'; }
  if (/[?&]source=app\b/.test(location.search) || navigator.standalone || matchMedia('(display-mode: standalone)').matches) d.classList.add('installed');
})();
