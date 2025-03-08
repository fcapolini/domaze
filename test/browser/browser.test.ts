import { test, expect, Page } from '@playwright/test';
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
        for (let i = 1;; i++) {
          const actual = await getActual(page);
          const expected = await getExpected(filePath, i);
          if (!expected) break;
          expect(actual).toEqual(expected);
          const button = await page.$('button.test-button');
          if (!button) break;
          await button.click();
        }
      });

    }
  });

}

async function getActual(page: Page) {
  let ret = await page.content();
  ret = ret.replace(/ data-domaze=\"\d+\"/sg, '');
  ret = ret.replace(/<!---.+?-->/g, '');
  ret = ret.replace(/<script.+?\/script>/sg, '');
  return ret.trim();
}

async function getExpected(filePath: string, nr: number) {
  const pname = filePath.replace('-in.html', `-out${nr}.html`);
  if (!fs.existsSync(pname)) return '';
  const ret = await fs.promises.readFile(pname, { 'encoding': 'utf8' });
  return ret.trim();
}
