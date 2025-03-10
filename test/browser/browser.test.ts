import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Server } from '../../src/server/server';

declare global {
  interface Window {
    __DOMAZE_PROPS: any;
    __domaze_context: any;
    domaze: any;
  }
}

const rootDir = path.join(__dirname, '.');
const dirs = fs.readdirSync(rootDir).filter(dir => {
  if (dir.startsWith('.')) return;
  if (!fs.statSync(path.join(rootDir, dir)).isDirectory()) return;
  return true;
});

for (let mode = 1; mode <= 3; mode++) {
  const ssr = !!(mode & 0x01);
  const csr = !!(mode & 0x02);
  let dirCount = 0;

  for (const dir of dirs) {
    const dirPath = path.join(rootDir, dir);
    const server = new Server({
      docroot: dirPath,
      port: 3000 + (mode - 1) + (dirCount++) * 3,
      mute: true,
      ssr,
      csr,
      clientCodePath: path.join(__dirname, '../../dist/client.js'),
    });
    test.beforeAll(async () => await server.start());
    test.afterAll(async () => await server.stop());

    test.describe(`${dir} ${ssr ? 'SSR' : ''} ${csr ? 'CSR' : ''}`.trim().replace(/\s+/g, ' '), () => {
      const files = fs.readdirSync(dirPath).filter(file => file.endsWith('-in.html'));
      for (const file of files) {
        const filePath = path.join(dirPath, file);

        test(file, async ({ page }) => {
          await page.goto(`http://localhost:${server.port}/${file}`);
          if (csr) {
            const cycle = await page.evaluate(() => window.domaze?.__ctx.cycle);
            expect(cycle).toEqual(1);
          } else {
            const domaze = await page.evaluate(() => !!window.domaze);
            expect(domaze).toEqual(false);
          }
          for (let i = 0; i < 10; i++) {
            const actual = await getActual(page);
            const expected = await getExpected(filePath, i);
            if (!expected) break;
            expect(actual).toEqual(expected);
            if (!csr) break;
            const test = await page.evaluate(() => window.domaze.test);
            if (typeof test === 'number') {
              await page.evaluate(() => window.domaze.test++);
              continue;
            }
            const button = await page.$('button.test-button');
            if (button) {
              await button.click();
              continue;
            }
            break;
          }
        });

      }
    });

  }

}

async function getActual(page: Page) {
  let ret = await page.content();
  ret = ret.replace(/ data-domaze=\"\d+\"/sg, '');
  ret = ret.replace(/<!---.+?-->/g, '');
  ret = ret.replace(/<script.+?\/script>/sg, '');
  // remove debugging stuff form received html
  ret = ret.replace(/<\/body>.+?<\/html>/, '</body></html>');
  return ret.trim();
}

async function getExpected(filePath: string, nr: number) {
  const pname = filePath.replace('-in.html', `-out${nr ? '-' + nr : ''}.html`);
  if (!fs.existsSync(pname)) return '';
  const ret = await fs.promises.readFile(pname, { 'encoding': 'utf8' });
  return ret.trim();
}
