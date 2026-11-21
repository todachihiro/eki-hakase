// えき はかせ！ PWA キャッシュ
const CACHE_NAME = 'eki-hakase-pwa-v1';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('eki-hakase-pwa-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if(req.mode === 'navigate'){
    event.respondWith(fetch(req).then(res => {
      if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put('./index.html',clone)));}
      return res;
    }).catch(async () => (await caches.match('./index.html')) || Response.error()));
  } else {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
  }
});
