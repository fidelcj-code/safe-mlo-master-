/* Offline mode: the whole app is kept on this device after the first visit, so it runs with no internet. A new version is fetched
   fresh (not from the browser cache) and takes over on its own. Settings → Offline mode asks this worker what it has saved and can refresh it. */
const VERSION = 'mlo-master-20261118114523-1b3e718b';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const save = c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => null)));
const count = c => Promise.all(CORE.map(u => c.match(u))).then(a => ({version: VERSION, saved: a.filter(Boolean).length, total: CORE.length}));
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(save).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mlo-master-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(c => c.match(r, {ignoreSearch: true}).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; })
      .catch(() => hit || (r.mode === 'navigate' ? c.match('./index.html').then(x => x || c.match('./')) : Response.error()));
    return hit || net;
  })));
});
self.addEventListener('message', e => {
  const d = e.data || {}, port = e.ports && e.ports[0]; if (!port) return;
  const reply = p => p.then(x => port.postMessage(x), () => port.postMessage(null));
  if (d.type === 'offline-status') e.waitUntil(reply(caches.open(VERSION).then(count)));
  else if (d.type === 'offline-save') e.waitUntil(reply(caches.open(VERSION).then(c => save(c).then(() => count(c)))));
});
