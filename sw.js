/* えき はかせ！：iPhoneホーム画面のオフライン起動修正版 */
const CACHE_NAME = 'eki-hakase-pwa-v3';
const APP_BASE = self.registration.scope;
const INDEX_URL = new URL('index.html', APP_BASE).href;
const ROOT_URL = new URL('./', APP_BASE).href;
const ASSET_URLS = [
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
].map(path => new URL(path, APP_BASE).href);

self.addEventListener('install', event => {
 event.waitUntil((async () => {
  const cache = await caches.open(CACHE_NAME);
  // 起動に必要なHTMLを必須として保存。アイコンなどの失敗で起動を妨げない。
  await cache.add(new Request(INDEX_URL, {cache: 'reload'}));
  await Promise.allSettled(ASSET_URLS.map(url => cache.add(new Request(url, {cache: 'reload'}))));
  await self.skipWaiting();
 })());
});

self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('eki-hakase-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch', event => {
 const req = event.request;
 if(req.method !== 'GET') return;
 const url = new URL(req.url);
 if(url.origin !== self.location.origin || !url.href.startsWith(APP_BASE)) return;

 if(req.mode === 'navigate') {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE_NAME);
   // Safariで「/」から保存されたアイコンも「index.html」から保存された
   // アイコンも、オフラインでは同じ起動ページへ導く。
   const cached = await cache.match(INDEX_URL);
   if(cached) return cached;
   try {
    const response = await fetch(req);
    if(response.ok) await cache.put(INDEX_URL, response.clone());
    return response;
   } catch (_) {
    return Response.error();
   }
  })());
  return;
 }

 if(url.href === INDEX_URL || url.href === ROOT_URL || ASSET_URLS.includes(url.href)) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE_NAME);
   return await cache.match(url.href === ROOT_URL ? INDEX_URL : req) || fetch(req);
  })());
 }
});
