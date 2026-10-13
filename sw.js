/**
 * NQuran Service Worker (PWA & Offline Cache)
 * Version: 1.1.3
 */

const CACHE_NAME = 'nquran-cache-v1.1.4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/embed',
  '/embed.html',
  '/css/style.css',
  '/css/player.css',
  '/css/mushaf.css',
  '/css/responsive.css',
  '/js/data.js',
  '/js/translations.js',
  '/js/player.js',
  '/js/mushaf.js',
  '/js/app.js',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio files: Network first with cache fallback or pass through
  if (url.pathname.endsWith('.mp3') || url.hostname.includes('mp3quran.net') || url.hostname.includes('nq-international.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // API calls (alquran.cloud): Network first with cache fallback
  if (url.hostname.includes('alquran.cloud')) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static shell: Cache first, fallback to network with clean URL normalization
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      // If /embed requested without .html, check if /embed.html is in cache
      if (url.pathname === '/embed') {
        return caches.match('/embed.html').then((embedCached) => embedCached || fetch(event.request));
      }
      return fetch(event.request);
    })
  );
});
