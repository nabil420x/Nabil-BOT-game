import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeViewportCameraScale,
  computeViewportLayoutState,
  isCompactMobileHud,
  isPortraitViewport,
  shouldShowRotatePrompt,
} from './orientation';

test('isPortraitViewport detects portrait vs landscape dimensions accurately', () => {
  assert.equal(isPortraitViewport(390, 844), true);
  assert.equal(isPortraitViewport(844, 390), false);
  assert.equal(isPortraitViewport(1440, 900), false);
  assert.equal(isPortraitViewport(0, 0), false);
});

test('isCompactMobileHud enables compact mode on phone portrait AND phone landscape, keeping desktop spacious', () => {
  // Phone portrait (Image 1)
  assert.equal(isCompactMobileHud(390, 844, true), true);
  assert.equal(isCompactMobileHud(412, 915, false), true);
  // Phone landscape (Image 2 target) - note width > 768 but height <= 540!
  assert.equal(isCompactMobileHud(844, 390, true), true);
  assert.equal(isCompactMobileHud(932, 430, false), true);
  assert.equal(isCompactMobileHud(667, 375, true), true);
  // Desktop viewports
  assert.equal(isCompactMobileHud(1440, 900, false), false);
  assert.equal(isCompactMobileHud(1280, 720, false), false);
});

test('shouldShowRotatePrompt only appears during active portrait mobile play when not dismissed', () => {
  assert.equal(
    shouldShowRotatePrompt({
      width: 390,
      height: 844,
      hasTouchPointer: true,
      isPlaying: true,
      isDismissed: false,
      isModalOpen: false,
    }),
    true
  );

  // Already rotated to landscape (844x390) -> prompt disappears
  assert.equal(
    shouldShowRotatePrompt({
      width: 844,
      height: 390,
      hasTouchPointer: true,
      isPlaying: true,
      isDismissed: false,
      isModalOpen: false,
    }),
    false
  );

  // Dismissed or paused/modal -> hidden
  assert.equal(
    shouldShowRotatePrompt({
      width: 390,
      height: 844,
      hasTouchPointer: true,
      isPlaying: true,
      isDismissed: true,
      isModalOpen: false,
    }),
    false
  );
  assert.equal(
    shouldShowRotatePrompt({
      width: 390,
      height: 844,
      hasTouchPointer: true,
      isPlaying: false,
      isDismissed: false,
      isModalOpen: false,
    }),
    false
  );
  assert.equal(
    shouldShowRotatePrompt({
      width: 1440,
      height: 900,
      hasTouchPointer: false,
      isPlaying: true,
      isDismissed: false,
      isModalOpen: false,
    }),
    false
  );
});

test('computeViewportCameraScale widens view on mobile screens while preserving 1.0 on desktop', () => {
  assert.equal(computeViewportCameraScale(1440, 900), 1.0);
  assert.equal(computeViewportCameraScale(1280, 720), 1.0);
  const mobileScale = computeViewportCameraScale(844, 390);
  assert.equal(mobileScale, 0.75);
  assert.equal(computeViewportCameraScale(390, 844), 0.75);
  assert.ok(computeViewportCameraScale(320, 240) >= 0.7);
});

test('computeViewportLayoutState combines flags consistently', () => {
  const layout = computeViewportLayoutState(844, 390, true, true);
  assert.deepEqual(layout, {
    width: 844,
    height: 390,
    hasTouchPointer: true,
    compactMobile: true,
    isPortrait: false,
    isFullscreen: true,
  });
});
