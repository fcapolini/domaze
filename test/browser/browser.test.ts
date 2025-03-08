import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Server } from '../../src/server/server';

// test('homepage has correct title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('homepage has a header', async ({ page }) => {
//   await page.goto('https://playwright.dev/');
//   await expect(page.locator('h1')).toHaveText(/Playwright/);
// });

const rootDir = path.join(__dirname, '.');
const dirs = fs.readdirSync(rootDir).filter(dir => {
  if (dir.startsWith('.')) return;
  if (!fs.statSync(path.join(rootDir, dir)).isDirectory()) return;
  return true;
});

for (const dir of dirs) {
  const dirPath = path.join(rootDir, dir);
  const server = new Server({
    docroot: dirPath,
    port: 3003,
    mute: true,
    clientCodePath: path.join(__dirname, '../../dist/client.js'),
  });
  test.beforeAll(async () => server.start());
  test.afterAll(async () => server.stop());

  test.describe(dir, () => {
    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('-in.html'));
    for (const file of files) {
      const filePath = path.join(dirPath, file);

      test(file, async ({ page }) => {
        await page.goto(`http://localhost:${server.port}/${file}`);
        const actual = await page.content();
        // console.log(actual);
        // const expected = fs.readFileSync(filePath.replace('-in.html', '-out.html'), 'utf8');
      });

    }
  });

}
