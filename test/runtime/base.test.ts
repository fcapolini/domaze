import { assert } from 'chai';
import { JSDOM } from 'jsdom';
import { describe } from 'mocha';
import { ClientPage } from '../../src/client/client-page';
import * as dom from '../../src/html/dom';
import { parse, normalizeSpace } from '../../src/html/parser';
import { Page, PageProps } from '../../src/runtime/page';
import * as k from '../../src/runtime/consts';
import { ServerPage } from '../../src/server/server-page';

describe('runtime/base', () => {
  ['server', 'client'].forEach(mode => describe(mode, () => {

    function load(html: string, props: PageProps): Page {
      if (mode === 'server') {
        const source = parse(html, 'test');
        return new ServerPage(source.doc, props);
      }
      const jsdom = new JSDOM(html);
      const doc = jsdom.window.document as unknown as dom.Document;
      return new ClientPage(doc, props);
    }

    it('001', () => {
      const page = load(
        `<html ${k.DOM_ID_ATTR}="0"></html>`,
        { root: { id: 0 } }
      );
      assert.exists(page.root);
      assert.equal(page.root.e, page.doc.documentElement);
      assert.equal(page.root.children.length, 0);
      const html = page.global.getMarkup();
      assert.equal(
        normalizeSpace(html),
        normalizeSpace(
          `<html ${k.DOM_ID_ATTR}="0"><head></head><body></body></html>`
        )
      )
    });

    it('002', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`, {
        root: {
          id: 0,
          children: [
            { id: 1 },
            { id: 2 },
          ]
        }
      });
      assert.equal(page.root.children.length, 2);
      const html = page.global.getMarkup();
      assert.equal(
        normalizeSpace(html),
        normalizeSpace(`<html ${k.DOM_ID_ATTR}="0">`
          + `<head ${k.DOM_ID_ATTR}="1"></head>
          <body ${k.DOM_ID_ATTR}="2">
          </body>`
          + `</html>`)
      )
    });

    it('003', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`, {
        root: {
          id: 0,
          name: 'page',
          children: [
            { id: 1, name: 'head' },
            { id: 2, name: 'body' },
          ]
        }
      });
      assert.equal(page.root.children.length, 2);
      assert.equal(page.root.name, 'page');
      assert.equal(page.root.children[0].name, 'head');
      assert.equal(page.root.children[1].name, 'body');
      const html = page.global.getMarkup();
      assert.equal(
        normalizeSpace(html),
        normalizeSpace(`<html ${k.DOM_ID_ATTR}="0">`
          + `<head ${k.DOM_ID_ATTR}="1"></head>
          <body ${k.DOM_ID_ATTR}="2">
          </body>`
          + `</html>`)
      )
    });

  }));
});
