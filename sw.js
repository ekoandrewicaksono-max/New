/**
 * Service Worker - Gudang Bahan Kering
 * -------------------------------------------------------------
 * Tujuan: hanya membuat "app shell" (HTML, manifest, ikon) bisa
 * tetap terbuka walau sinyal internet lemah/putus sesaat, dan
 * memenuhi syarat agar browser menawarkan "Install app" di HP.
 *
 * PENTING: request ke Google Apps Script (data stok/selisih) TIDAK
 * ikut di-cache di sini - selalu diambil langsung dari jaringan,
 * supaya data yang tampil tetap sesuai dengan yang ada di Sheets.
 */

const CACHE_NAME = 'gudang-kering-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya proses request GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // JANGAN sentuh/cache request ke Google Apps Script (data stok) atau ke domain lain
  // (CDN Tailwind, Chart.js, Font Awesome, Google Fonts, dll) - biarkan lewat apa adanya
  // supaya data & library selalu versi terbaru dari jaringan.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Untuk file app-shell milik sendiri: coba cache dulu (cepat & bisa offline),
  // lalu perbarui cache di belakang layar kalau jaringan tersedia (stale-while-revalidate).
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // offline & tidak ada cache -> biarkan gagal

      return cached || networkFetch;
    })
  );
});
