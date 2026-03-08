const CACHE_NAME = 'savy-v1';
const STATIC_ASSETS = ['/', '/deals', '/receipt'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Cache-first לנכסים סטטיים, network-first לAPI
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});

// Push Notifications
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
