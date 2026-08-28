const CACHE = 'fuel-calc-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './app.js', './style.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  // Network-first for the government price API, cache-first for app shell
  if (e.request.url.includes('oilprice.json') || e.request.url.includes('data.gov.hk')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
