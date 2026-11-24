import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // Purge any old caching SWs (e.g. stale Workbox/preview caches), then register
    // a pure network-passthrough /sw-dev.js so Chromium allows PWA install without caching bundles.
    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        const legacyRegs = registrations.filter((reg) => {
          const url = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          return !url.endsWith('/sw-dev.js');
        });
        await Promise.all(legacyRegs.map((reg) => reg.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        await navigator.serviceWorker.register('/sw-dev.js', { scope: '/' });
      })
      .catch(() => {});
  } else {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        registration.update().catch(() => {});
        const checkUpdate = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        window.addEventListener('focus', checkUpdate);
        document.addEventListener('visibilitychange', checkUpdate);
      },
      onNeedRefresh() {
        updateSW(true);
      },
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
