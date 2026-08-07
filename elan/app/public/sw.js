/* Service worker Élan — rend l'app installable (WebAPK Android) et utilisable hors-ligne.
   Stratégie : network-first. On sert toujours la version réseau quand elle est
   disponible (donc jamais de version périmée après un déploiement Vercel), et on
   retombe sur le cache uniquement hors-ligne. */
const CACHE = 'elan-v34';
/* Cache de configuration (rappels) — partagé entre la page et le service worker.
   Il ne contient PAS de ressources : c'est un petit magasin JSON, plus simple qu'IndexedDB
   et lisible des deux côtés. Il doit survivre aux changements de version du cache. */
const CFG_CACHE = 'elan-cfg';
const CFG_URL = '/__elan_reminder';
const SHELL = [
  '/', '/index.html', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => ((k !== CACHE && k !== CFG_CACHE) ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname === CFG_URL) return;   // magasin interne, jamais servi au réseau
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('/index.html') : undefined)))
  );
});

/* ─── Rappels ─────────────────────────────────────────────────────────────────
   Élan n'a pas de serveur : il n'y a donc pas de push distant. Le rappel est
   LOCAL — il est déclenché par le navigateur lui-même, via periodicSync quand
   il est disponible (PWA installée sur Android), et sinon rattrapé par la page
   à sa prochaine ouverture. On garde une trace du dernier jour notifié pour ne
   jamais notifier deux fois le même jour. */

function readCfg() {
  return caches.open(CFG_CACHE)
    .then((c) => c.match(CFG_URL))
    .then((r) => (r ? r.json() : null))
    .catch(() => null);
}
function writeCfg(cfg) {
  return caches.open(CFG_CACHE)
    .then((c) => c.put(CFG_URL, new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } })))
    .catch(() => {});
}
function todayKey(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

/* Une notification est due si : les rappels sont activés, l'heure configurée est
   passée aujourd'hui, aucune notification n'a déjà été envoyée aujourd'hui, et la
   séance du jour n'est pas déjà faite. */
function reminderDue(cfg) {
  if (!cfg || !cfg.on) return false;
  const now = new Date();
  const key = todayKey(now);
  if (cfg.lastNotified === key) return false;
  if (cfg.doneDate === key) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const h = cfg.hour == null ? 18 : cfg.hour;   // 0 h est une heure valide : pas de `||` ici
  const m = cfg.min == null ? 0 : cfg.min;
  return mins >= (h * 60 + m);
}

function showReminder(cfg) {
  const body = (cfg && cfg.body) || 'Ta séance du jour t’attend — même 10 minutes comptent.';
  return self.registration.showNotification('Élan', {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'elan-daily',
    renotify: false,
    requireInteraction: false,
    data: { url: '/' },
  }).then(() => writeCfg(Object.assign({}, cfg, { lastNotified: todayKey() })));
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag !== 'elan-daily') return;
  e.waitUntil(readCfg().then((cfg) => (reminderDue(cfg) ? showReminder(cfg) : undefined)));
});

/* Déclenchement explicite depuis la page (rattrapage à l'ouverture, ou test depuis les réglages). */
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'elan-cfg') { e.waitUntil(writeCfg(d.cfg || {})); return; }
  if (d.type === 'elan-check') { e.waitUntil(readCfg().then((cfg) => (reminderDue(cfg) ? showReminder(cfg) : undefined))); return; }
  if (d.type === 'elan-test') { e.waitUntil(readCfg().then((cfg) => self.registration.showNotification('Élan', {
    body: (cfg && cfg.body) || 'Ceci est un test de rappel.', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'elan-test', data: { url: '/' },
  }))); }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});
