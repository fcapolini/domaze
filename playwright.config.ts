import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    browserName: 'chromium', // Options: 'chromium', 'firefox', 'webkit'
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://localhost:3003', // Change as needed
  },
  testDir: './test/browser',
});
