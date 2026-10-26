import { defineConfig } from '@playwright/test';

/**
 * Demo-only config: runs the checkout happy path slowly, full screen, and records a video.
 * Not used by `npm test` or CI. Run with `npm run demo:checkout`.
 */
export default defineConfig({
  testDir: './demo',
  testMatch: /.*\.demo\.ts/,
  timeout: 5 * 60_000,
  workers: 1,
  reporter: 'list',
  outputDir: 'demo-results',

  use: {
    browserName: 'chromium',
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    headless: false,
    // No fixed viewport: the page fills the full-screen window.
    // Full screen and the video size are set up in the demo file.
    viewport: null,
    launchOptions: { slowMo: Number(process.env.SLOW_MO ?? 300) },
  },
});
