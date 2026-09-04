const CACHE_NAME = "gudang-bahan-kering-v1";

const APP_CACHE = [
 "./",
 "./index.html",
 "./manifest.json"
];

self.addEventListener("install", event => {
 event.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(APP_CACHE))
 );
 self.skipWaiting();
});

self.addEventListener("activate", event => {
 event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
 event.respondWith(
  caches.match(event.request)
   .then(res => res || fetch(event.request))
 );
});