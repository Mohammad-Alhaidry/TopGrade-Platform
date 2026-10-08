// app.topgradeedu.com moved to smartpro-edu.com. Sends the student to the same page there. Saved progress
// lives per address, so it travels in the link (#tg-import=..., read by assets/js/boot.js on the new address).
// The install-offer dismissal stays behind on purpose: the new address should offer its own app.
(function () {
  var TO = 'https://smartpro-edu.com';
  var KEYS = ['topgrade.progress.v1', 'topgrade.run.v1', 'topgrade.lang', 'topgrade.theme'];
  var data = {};
  var any = false;
  try {
    KEYS.forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v !== null) { data[k] = v; any = true; }
    });
  } catch (e) { /* storage unavailable: move without progress */ }
  var hash = '';
  if (any) {
    var bytes = new TextEncoder().encode(JSON.stringify(data));
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    hash = '#tg-import=' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  location.replace(TO + location.pathname + location.search + hash);
})();
