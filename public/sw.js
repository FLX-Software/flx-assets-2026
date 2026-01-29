// Cache-Version: Bei Änderungen alte Caches löschen
const CACHE_NAME = 'flx-assets-v4';

// Nur manifest für PWA-Install – HTML/JS nie pre-cachen (verhindert Stale nach Deploy)
const ASSETS_TO_CACHE = ['/manifest.json'];

// Assets die NICHT gecacht werden sollen
const NO_CACHE_PATTERNS = [
  /\/assets\/.*\.js$/,
  /\/assets\/.*\.mjs$/,
  /\/assets\/.*\.css$/,
  /\/index\.html$/,
  /^\/$/,  // Root
];

// API / Daten-Requests: niemals cachen, immer frisch
const API_OR_DATA_PATTERNS = [
  /supabase\.co/i,
  /supabase\.in/i,
  /\/rest\/v1\//i,
  /\/auth\/v1\//i,
  /\/realtime\//i,
  /\/storage\/v1\//i,
];

function isApiOrDataRequest(url) {
  return API_OR_DATA_PATTERNS.some(function (p) {
    return p.test(url);
  });
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isDocumentRequest(request, url) {
  try {
    var u = new URL(url);
    return u.pathname === '/' || u.pathname === '/index.html';
  } catch (_) {
    return false;
  }
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var url = event.request.url;
  var request = event.request;

  // 1. API / Supabase: Immer durchreichen, nie cachen, credentials erhalten
  if (isApiOrDataRequest(url) || request.method !== 'GET') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        credentials: request.credentials,
      }).catch(function (err) {
        console.error('[SW] API fetch failed:', url, err);
        throw err;
      })
    );
    return;
  }

  // 2. Navigation / HTML-Dokument: NIEMALS cachen – immer frisch vom Netz
  // Verhindert: Stale HTML nach Deploy, falsche JS-Referenzen, Auth-Probleme
  // Nutze Navigation Preload wenn verfügbar (schnellerer First Load)
  if (isNavigationRequest(request) || isDocumentRequest(request, url)) {
    event.respondWith(
      (event.preloadResponse || Promise.resolve(null))
        .then(function (preloadResponse) {
          if (preloadResponse) return preloadResponse;
          return fetch(request, {
            cache: 'no-store',
            credentials: request.credentials,
          });
        })
        .catch(function () {
          return caches.match(request);
        })
    );
    return;
  }

  var urlObj = new URL(url);
  var shouldCache = !NO_CACHE_PATTERNS.some(function (p) {
    return p.test(urlObj.pathname);
  });

  // 3. JS/CSS (hashed): Nicht cachen, immer frisch
  if (!shouldCache) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(function () {
        return caches.match(request);
      })
    );
    return;
  }

  // 4. Sonstige statische Assets (z.B. Favicon): Network-First, bei Erfolg cachen
  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then(function (response) {
        if (
          request.method === 'GET' &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});
