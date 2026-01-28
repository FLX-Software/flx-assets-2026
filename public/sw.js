const CACHE_NAME = 'flx-assets-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Assets die NICHT gecacht werden sollen (z.B. JS-Module)
const NO_CACHE_PATTERNS = [
  /\/assets\/.*\.js$/,
  /\/assets\/.*\.mjs$/,
  /\/assets\/.*\.css$/,
];

// API / Daten-Requests: niemals cachen, immer cache: 'no-store'
// Verhindert "zweiter Aufruf funktioniert nicht"-Bug durch Stale-Responses
const API_OR_DATA_PATTERNS = [
  /supabase\.co/i,
  /\/rest\/v1\//i,
  /\/auth\/v1\//i,
  /\/realtime\//i,
];

function isApiOrDataRequest(url) {
  return API_OR_DATA_PATTERNS.some(function(p) { return p.test(url); });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // API / Supabase: nie cachen, immer frisch vom Netz (cache: 'no-store')
  if (isApiOrDataRequest(url) || event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
    return;
  }

  var urlObj = new URL(url);
  var shouldCache = !NO_CACHE_PATTERNS.some(function(p) { return p.test(urlObj.pathname); });

  if (!shouldCache) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Nur statische Same-Origin-Seiten: Network-First, bei Erfolg cachen
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(function(response) {
        if (event.request.method === 'GET' && response.status === 200 && response.type === 'basic') {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
