// ChronoDevis AI – service worker : ouverture rapide et page hors connexion. Ne touche jamais à /api.
var VERSION = 'chronodevis-v15';
var CORE = ['/offline.html', '/icons/icon-192.png', '/assets/app.css?v=10', '/assets/core.js?v=11', '/assets/i18n.js?v=13', '/assets/qr.js?v=1', '/assets/app.js?v=13'];
var CDN = /^https:\/\/(cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname.indexOf('/api/') === 0) return;
  if (req.mode === 'navigate') {                         // pages : réseau d'abord, copie en cache si hors ligne
    var key = url.origin + url.pathname;                 // une copie par page (sans les paramètres)
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(key, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(key).then(function (hit) { return hit || caches.match('/offline.html'); });
    }));
    return;
  }
  var STATIC = /\.(css|js|png|jpg|jpeg|svg|webp|woff2?|webmanifest)$/i;
  if ((url.origin === self.location.origin && STATIC.test(url.pathname)) || CDN.test(req.url)) {   // fichiers statiques uniquement
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
