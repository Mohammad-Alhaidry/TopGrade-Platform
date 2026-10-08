// Arriving from the old address (app.topgradeedu.com -> smartpro-edu.com): it sends the progress saved on the
// student's device in the link (#tg-import=...), because each address has its own storage. Keep it unless this
// device already has its own copy here, then take it out of the address. Must run before anything reads storage.
(function () {
  var m = /^#tg-import=([A-Za-z0-9_-]{1,500000})$/.exec(location.hash);
  if (!m) return;
  try {
    var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    var bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var data = JSON.parse(new TextDecoder().decode(bytes));
    ['topgrade.progress.v1', 'topgrade.run.v1', 'topgrade.lang', 'topgrade.theme'].forEach(function (k) {
      if (typeof data[k] === 'string' && localStorage.getItem(k) === null) localStorage.setItem(k, data[k]);
    });
  } catch (e) { /* a damaged link: start fresh rather than fail */ }
  history.replaceState(history.state, '', location.pathname + location.search);
})();

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
