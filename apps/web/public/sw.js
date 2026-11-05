// savy-v2: network-first for pages so deploys reach returning users immediately.
// v1 served '/' cache-first forever — users kept seeing a stale homepage after
// every deploy. Bumping CACHE_NAME clears the old cache on activate.
const CACHE_NAME = 'savy-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // hashed build assets + static images: immutable, cache-first
  const isImmutable =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/recipes-img/') ||
    url.pathname.startsWith('/logos/') ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname);

  if (isImmutable) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // everything else (pages, API, data): network-first, cache only as offline fallback
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// Push Notifications (unchanged from v1)
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Savy', {
      body: data.body || 'יש מבצע חדש!',
      icon: '/icons/favicon.png',
      badge: '/icons/favicon.png',
      dir: 'rtl',
      lang: 'he',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'פתח' },
        { action: 'close', title: 'סגור' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const w = wins.find(w => w.url === url);
      if (w) return w.focus();
      return clients.openWindow(url);
    })
  );
});
