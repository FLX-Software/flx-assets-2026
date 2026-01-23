
const CACHE_NAME = 'flx-assets-v1';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Skip waiting, damit der neue Service Worker sofort aktiv wird
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients, damit der neue Service Worker sofort Kontrolle übernimmt
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Prüfe ob die Anfrage gecacht werden soll
  const shouldCache = !NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  // Für Assets die nicht gecacht werden sollen, direkt fetchen
  if (!shouldCache) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Für andere Anfragen: Cache-First Strategie
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Nur GET-Requests cachen
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
