self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      await self.clients.claim();
    })()
  );
});

// Pure network passthrough for development: satisfies PWA installability
// without ever caching JS, CSS, or HTML bundles.
self.addEventListener('fetch', () => {});
