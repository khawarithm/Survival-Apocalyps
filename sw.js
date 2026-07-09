/* ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.1 (OFFLINE LOGISTICS)
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : sw.js
  DESC                  : Service Worker PWA - Caching Aset Lokal
  ========================================================================
*/

const CACHE_NAME = 'survivor-fortress-cache-v2.1';

// Daftar seluruh amunisi file lokal yang wajib dikunci agar bisa berjalan offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './lobby.html',
  './game.html',
  './manifest.json',
  './css/style.css',
  './css/auth.css',
  './css/game.css',
  './js/firebase-init.js',
  './js/auth.js',
  './js/main.js',
  './js/ui.js',
  './js/game.js'
];

// 1. TAHAP INSTALASI: Mengunci seluruh aset ke dalam Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA WORKER] Mengamankan perimeter, menyuplai seluruh aset ke lokal cache...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. TAHAP AKTIVASI: Membersihkan sisa cache lama (Pembersihan Taktis)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA WORKER] Menghancurkan cache usang logistik lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. TAHAP FETCH: Gunakan Cache lokal jika Offline, tembak Jaringan jika Online
self.addEventListener('fetch', (event) => {
  // Biarkan request Firebase bypass Service Worker agar tidak konflik cloud data
  if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Suplai dari cache aman
        }
        return fetch(event.request); // Ambil dari internet jika ada koneksi
      })
  );
});
