// Replaces the app's offline worker on app.topgradeedu.com once the app has moved. An installed app updates to
// this, which clears the old offline copy and reloads its windows; the reload reaches the server, which answers
// with the moving page (index.html + move.js) that takes the student and their progress to smartpro-edu.com.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys()
    .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.registration.unregister(); })
    .then(function () { return self.clients.matchAll({ type: 'window' }); })
    .then(function (windows) { windows.forEach(function (w) { w.navigate(w.url); }); }));
});
