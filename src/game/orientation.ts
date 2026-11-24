export interface ViewportLayoutState {
  width: number;
  height: number;
  hasTouchPointer: boolean;
  compactMobile: boolean;
  isPortrait: boolean;
  isFullscreen: boolean;
}

export function isPortraitViewport(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  return height > width;
}

/**
 * Determines whether the game HUD should render in compact Mini-Militia mobile mode.
 * Triggers for:
 * - Narrow portrait/tablet screens (< 768px width)
 * - Short mobile landscape screens (<= 540px height, e.g. 844x390, 932x430, 667x375)
 * - Touch devices whose shortest dimension is phone/compact tablet sized (<= 560px)
 * Desktop (e.g. 1280x720, 1440x900) stays in full desktop HUD mode.
 */
export function isCompactMobileHud(
  width: number,
  height: number,
  hasTouchPointer: boolean = false
): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  if (width < 768) return true;
  if (height <= 540) return true;
  if (hasTouchPointer && Math.min(width, height) <= 560) return true;
  return false;
}

export function computeViewportLayoutState(
  width: number,
  height: number,
  hasTouchPointer: boolean,
  isFullscreen: boolean
): ViewportLayoutState {
  return {
    width,
    height,
    hasTouchPointer,
    compactMobile: isCompactMobileHud(width, height, hasTouchPointer),
    isPortrait: isPortraitViewport(width, height),
    isFullscreen,
  };
}

export function shouldShowRotatePrompt(params: {
  width: number;
  height: number;
  hasTouchPointer: boolean;
  isPlaying: boolean;
  isDismissed: boolean;
  isModalOpen?: boolean;
}): boolean {
  if (!params.isPlaying || params.isDismissed || params.isModalOpen) {
    return false;
  }
  if (!isPortraitViewport(params.width, params.height)) {
    return false;
  }
  return params.hasTouchPointer || params.width <= 640;
}

/**
 * Computes an adaptive world camera zoom factor so small phone screens (both portrait
 * 390x844 and landscape 844x390) preserve wide tactical arena visibility instead of
 * zooming too tightly around the player. Desktop viewports (>= 620px min side) stay 1.0.
 */
export function computeViewportCameraScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1.0;
  }
  const minDim = Math.min(width, height);
  if (minDim >= 620) return 1.0;
  const raw = minDim / 520;
  return Math.max(0.7, Math.min(0.96, Math.round(raw * 100) / 100));
}

export function detectTouchCapability(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const maxTouch = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  return coarse || maxTouch > 0;
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export interface LandscapeRequestResult {
  fullscreenEntered: boolean;
  orientationLocked: boolean;
}

/**
 * Best-effort user-gesture handler to enter fullscreen + lock landscape orientation
 * on mobile browsers (Android Chrome / Edge / PWA). Gracefully no-ops on platforms
 * where orientation lock is unsupported or blocked (e.g. iOS Safari or iframes).
 */
export async function requestLandscapeFullscreen(): Promise<LandscapeRequestResult> {
  let fullscreenEntered = isFullscreenActive();
  let orientationLocked = false;

  if (typeof document !== 'undefined' && !fullscreenEntered) {
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (typeof root.requestFullscreen === 'function') {
        await root.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        fullscreenEntered = true;
      } else if (typeof root.webkitRequestFullscreen === 'function') {
        await root.webkitRequestFullscreen();
        fullscreenEntered = true;
      }
    } catch {
      fullscreenEntered = isFullscreenActive();
    }
  }

  if (typeof screen !== 'undefined') {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (lockType: 'landscape' | 'landscape-primary' | 'any') => Promise<void>;
    };
    if (orientation && typeof orientation.lock === 'function') {
      try {
        await orientation.lock('landscape');
        orientationLocked = true;
      } catch {
        orientationLocked = false;
      }
    }
  }

  return { fullscreenEntered, orientationLocked };
}

export async function exitLandscapeFullscreen(): Promise<void> {
  if (typeof screen !== 'undefined') {
    const orientation = screen.orientation as ScreenOrientation & {
      unlock?: () => void;
    };
    try {
      orientation?.unlock?.();
    } catch {
      // ignore unsupported unlock errors
    }
  }

  if (typeof document !== 'undefined' && isFullscreenActive()) {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (typeof doc.exitFullscreen === 'function') {
        await doc.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // ignore
    }
  }
}
