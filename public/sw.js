// ChronoDevis AI – service worker : ouverture rapide et page hors connexion. Ne touche jamais à /api.
var VERSION = 'chronodevis-v1';
var CORE = ['/', '/offline.html', '/icons/icon-192.png'];
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
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('/', copy); }); }
      return res;
    }).catch(function () {
      return caches.match('/').then(function (hit) { return hit || caches.match('/offline.html'); });
    }));
    return;
  }
  if (url.origin === self.location.origin || CDN.test(req.url)) {   // styles, polices, icônes : cache + mise à jour
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
