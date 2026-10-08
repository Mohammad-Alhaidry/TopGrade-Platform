import { test } from 'node:test';
import assert from 'node:assert/strict';

// install.js registers window listeners at import; give it a minimal window.
globalThis.addEventListener ??= () => {};
const { detectPlatform } = await import('../public/assets/js/app/install.js');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';

test('iPhone and iPadOS (which reports itself as a Mac) are detected as iOS', () => {
  assert.equal(detectPlatform({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 }).ios, true);
  assert.equal(detectPlatform({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5 }).ios, true);
});

test('a real Mac and Android are not iOS', () => {
  assert.equal(detectPlatform({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 0 }).ios, false);
  assert.equal(detectPlatform({ userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 }).ios, false);
});

test('running from the home screen counts as installed', () => {
  assert.equal(detectPlatform({ userAgent: IPHONE, standalone: true }).installed, true);
  assert.equal(detectPlatform({ userAgent: ANDROID, displayStandalone: true }).installed, true);
  assert.equal(detectPlatform({ userAgent: IPHONE }).installed, false);
});
