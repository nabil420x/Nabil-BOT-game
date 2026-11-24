import { useEffect, useState, useCallback } from 'react';
import {
  buildStandaloneInstallUrl,
  detectInstallPlatform,
  type InstallPlatform,
} from '../game/install';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let cachedDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((cb) => cb(cachedDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    cachedDeferredPrompt = null;
    listeners.forEach((cb) => cb(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    cachedDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [platform, setPlatform] = useState<InstallPlatform>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return detectInstallPlatform(window.navigator.userAgent, standalone);
  });
  const [inIframe, setInIframe] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const syncStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
      setPlatform(detectInstallPlatform(window.navigator.userAgent, standalone));
    };

    syncStandalone();
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }

    const onPromptChange = (evt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(evt);
    };
    listeners.add(onPromptChange);

    const onAppInstalled = () => {
      setIsInstalled(true);
      setPlatform('installed');
      setDeferredPrompt(null);
      cachedDeferredPrompt = null;
    };
    window.addEventListener('appinstalled', onAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', syncStandalone);

    return () => {
      listeners.delete(onPromptChange);
      window.removeEventListener('appinstalled', onAppInstalled);
      mediaQuery.removeEventListener('change', syncStandalone);
    };
  }, []);

  const install = useCallback(async () => {
    const activePrompt = deferredPrompt || cachedDeferredPrompt;
    if (!activePrompt) return false;
    await activePrompt.prompt();
    const { outcome } = await activePrompt.userChoice;
    if (outcome === 'accepted') {
      cachedDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setPlatform('installed');
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const installUrl =
    typeof window !== 'undefined'
      ? buildStandaloneInstallUrl(window.location.origin)
      : '/';

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: platform === 'ios',
    platform,
    inIframe,
    installUrl,
    install,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
