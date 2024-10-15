import { describe } from 'mocha';
import * as dom from '../../src/html/dom';
import { JSDOM } from 'jsdom';
import path from 'path';
import fs from 'fs';
import { normalizeText, parse } from '../../src/html/parser';
import { ServerElement } from '../../src/html/server-dom';
import { assert } from 'chai';

// const docroot = path.join(__dirname, 'dom');

// function child(e: dom.Element, tagName: string): dom.Element | null {
//   for (const n of e.childNodes) {
//     if (n.nodeType === ELEMENT_NODE && (n as dom.Element).tagName === tagName) {
//       return n as dom.Element;
//     }
//   }
//   return null;
// }

// function lookup(e: dom.Element | null, tagNames: string[]): dom.Element | null {
//   tagNames.forEach(tagName => e = e && child(e, tagName));
//   return e;
// }

describe('html/dom', () => {
  for (const mode of ['server', 'client']) {

    // eslint-disable-next-line
    async function load(text: string): Promise<dom.Document> {
      text = normalizeText(text)!;
      const ret = mode === 'client'
        ? new JSDOM(text).window.document as unknown as dom.Document
        : parse(text, 'test').doc;
      return ret;
    }

    // eslint-disable-next-line
    function markup(e: dom.Element): string {
      if (mode === 'client') {
        return normalizeText((e as unknown as Element).outerHTML)!;
      }
      return normalizeText((e as ServerElement).toString())!;
    }

    describe(mode, () => {

      it('class001', async () => {
        const doc = await load(`
          <html class="page"><head></head><body>
          </body></html>
        `);
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="page"><head></head><body>
            </body></html>
          `)
        )
      });

      it('class002', async () => {
        const doc = await load(`
          <html class="class1 class2"><head></head><body>
          </body></html>
        `);
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="class1 class2"><head></head><body>
            </body></html>
          `)
        )
      });

      it('class003', async () => {
        const doc = await load(`
          <html><head></head><body>
          </body></html>
        `);
        doc.documentElement?.classList.add('class1');
        doc.documentElement?.classList.add('class2');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="class1 class2"><head></head><body>
            </body></html>
          `)
        )
      });

      it('class004', async () => {
        const doc = await load(`
          <html class=""><head></head><body>
          </body></html>
        `);
        doc.documentElement?.classList.add('class1');
        doc.documentElement?.classList.add('class2');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="class1 class2"><head></head><body>
            </body></html>
          `)
        )
      });

      it('class005', async () => {
        const doc = await load(`
          <html class="page"><head></head><body>
          </body></html>
        `);
        const root = doc.documentElement!
        root.classList.add('class1');
        root.classList.add('class2');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="page class1 class2"><head></head><body>
            </body></html>
          `)
        )
      });

      it('class006', async () => {
        const doc = await load(`
          <html class="page"><head></head><body>
          </body></html>
        `);
        const root = doc.documentElement!
        root.classList.add('class1');
        root.classList.add('class2');
        root.classList.remove('class1');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html class="page class2"><head></head><body>
            </body></html>
          `)
        )
      });

      it('style001', async () => {
        const doc = await load(`
          <html style="color: blue;"><head></head><body>
          </body></html>
        `);
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="color: blue;"><head></head><body>
            </body></html>
          `)
        )
      });

      it('style002', async () => {
        const doc = await load(`
          <html style="color: blue; border-width: 1px"><head></head><body>
          </body></html>
        `);
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="color: blue; border-width: 1px"><head></head><body>
            </body></html>
          `)
        )
      });

      it('style003', async () => {
        const doc = await load(`
          <html><head></head><body>
          </body></html>
        `);
        doc.documentElement?.style.setProperty('color', 'blue');
        doc.documentElement?.style.setProperty('border-width', '1px');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="color: blue; border-width: 1px;"><head></head><body>
            </body></html>
          `)
        )
      });

      it('style004', async () => {
        const doc = await load(`
          <html style=""><head></head><body>
          </body></html>
        `);
        doc.documentElement?.style.setProperty('color', 'blue');
        doc.documentElement?.style.setProperty('border-width', '1px');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="color: blue; border-width: 1px;"><head></head><body>
            </body></html>
          `)
        )
      });

      it('style005', async () => {
        const doc = await load(`
          <html style="background: red"><head></head><body>
          </body></html>
        `);
        doc.documentElement?.style.setProperty('color', 'blue');
        doc.documentElement?.style.setProperty('border-width', '1px');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="background: red; color: blue; border-width: 1px;">`
            + `<head></head><body>
            </body></html>
          `)
        )
      });

      it('style006', async () => {
        const doc = await load(`
          <html style="background: red"><head></head><body>
          </body></html>
        `);
        doc.documentElement?.style.setProperty('color', 'blue');
        doc.documentElement?.style.setProperty('border-width', '1px');
        doc.documentElement?.style.removeProperty('color');
        assert.equal(
          markup(doc.documentElement!),
          normalizeText(`
            <html style="background: red; border-width: 1px;">`
            + `<head></head><body>
            </body></html>
          `)
        )
      });

      // it('template001', async () => {
      //   const doc = await load('template001.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.exists(fragment);
      //   assert.equal(fragment.childNodes.length, 0);
      // });

      // it('template002', async () => {
      //   const doc = await load('template002.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.equal(fragment.childNodes.length, 1);
      //   const div = lookup(fragment, ['DIV']);
      //   assert.exists(div);
      // });

      // it('template003', async () => {
      //   const doc = await load('template003.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.equal(fragment.childNodes.length, 3);
      //   const div = lookup(fragment, ['DIV']);
      //   assert.exists(div);
      // });

      // it('template004', async () => {
      //   const doc = await load('template004.html', client);
      //   const body = lookup(doc, ['HTML', 'BODY']);
      //   const template = lookup(body, ['TEMPLATE']) as dom.TemplateElement;
      //   const clone = template.content.cloneNode(true);
      //   body?.insertBefore(clone, template);
      //   const div = lookup(body, ['DIV']);
      //   assert.exists(div);
      //   assert.equal(div.nodeType, ELEMENT_NODE);
      //   assert.equal(
      //     normalizeSpace(markup(body!, client)),
      //     normalizeSpace(`<body>
      //       <div></div><template><div></div></template>
      //     </body>`)
      //   )
      // });

    });

  }
});
