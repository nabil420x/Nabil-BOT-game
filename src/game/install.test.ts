import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlayableLauncherHtml,
  buildStandaloneInstallUrl,
  detectInstallPlatform,
  getInstallInstructions,
  sanitizeLauncherUrl,
} from './install';

test('detectInstallPlatform identifies standalone, iOS, Android, and desktop accurately', () => {
  assert.equal(detectInstallPlatform('Mozilla/5.0 (Linux; Android 14)', true), 'installed');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', false), 'ios');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)', false), 'android');
  assert.equal(detectInstallPlatform('Mozilla/5.0 (X11; Linux x86_64) Chrome/124', false), 'desktop');
});

test('getInstallInstructions returns iframe-aware steps, Bengali summary, and offline support', () => {
  const androidGuide = getInstallInstructions('android', true);
  assert.equal(androidGuide.supportsOffline, true);
  assert.equal(androidGuide.steps.length, 3);
  assert.match(androidGuide.steps[0], /Open Full Game Tab/i);
  assert.ok(androidGuide.bengaliSummary.length > 10);

  const iosGuide = getInstallInstructions('ios', false);
  assert.equal(iosGuide.steps.length, 2);
  assert.match(iosGuide.steps[1], /Add to Home Screen/i);

  const installedGuide = getInstallInstructions('installed', false);
  assert.equal(installedGuide.headline, 'App Installed');
});

test('buildStandaloneInstallUrl normalizes origin trailing slashes', () => {
  assert.equal(buildStandaloneInstallUrl('https://example.run.app/'), 'https://example.run.app/');
  assert.equal(buildStandaloneInstallUrl('https://example.run.app'), 'https://example.run.app/');
  assert.equal(buildStandaloneInstallUrl(''), '/');
});

test('sanitizeLauncherUrl accepts http/https URLs and rejects unsafe schemes', () => {
  assert.equal(
    sanitizeLauncherUrl('https://example.run.app/'),
    'https://example.run.app/'
  );
  assert.equal(
    sanitizeLauncherUrl('http://localhost:3000/'),
    'http://localhost:3000/'
  );
  assert.equal(sanitizeLauncherUrl('javascript:alert(1)'), '/');
  assert.equal(sanitizeLauncherUrl('data:text/html,<script>'), '/');
});

test('buildPlayableLauncherHtml generates self-contained launcher HTML with escaped URL', () => {
  const html = buildPlayableLauncherHtml('https://example.run.app/?ref=1&mode=app');
  assert.match(html, /NaBil-BOT: Cyber Protocol/);
  assert.match(html, /https:\/\/example\.run\.app\/\?ref=1&amp;mode=app/);
  assert.match(html, /window\.location\.replace/);
});
