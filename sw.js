/* Offline: the app is kept on the phone after the first visit. A new version is fetched fresh (not from the browser cache) and takes over on its own. */
const VERSION = 'mlo-master-20261021184300-5caf6e40';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mlo-master-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(c => c.match(r, {ignoreSearch: true}).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => hit || c.match('./index.html'));
    return hit || net;
  })));
});
