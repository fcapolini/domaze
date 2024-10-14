import { assert } from 'chai';
import { JSDOM } from 'jsdom';
import { describe } from 'mocha';
import { ClientPage } from '../../src/client/client-page';
import * as dom from '../../src/html/dom';
import { normalizeSpace, parse } from '../../src/html/parser';
import * as k from '../../src/runtime/consts';
import { Page, PageProps } from '../../src/runtime/page';
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
        + `</html>`,
        {
          root: {
            id: 0,
            children: [
              { id: 1 },
              { id: 2 },
            ]
          }
        }
      );
      assert.equal(page.root.children.length, 2);
      assert.equal(page.root.e.tagName, 'HTML');
      assert.equal(page.root.children[0].parent, page.root);
      assert.equal(page.root.children[0].e.tagName, 'HEAD');
      assert.equal(page.root.children[1].parent, page.root);
      assert.equal(page.root.children[1].e.tagName, 'BODY');
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
        + `</html>`,
        {
          root: {
            id: 0,
            name: 'page',
            children: [
              { id: 1, name: 'head' },
              { id: 2, name: 'body' },
            ]
          }
        }
      );
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

    it('101', () => {
      const page = load(
        `<html ${k.DOM_ID_ATTR}="0"></html>`,
        { root: { id: 0, name: 'page' } }
      );
      assert.exists(page.root.obj);
      const root = page.root.obj;
      assert.equal(root[k.RT_ID_KEY], 0);
    });

    it('102', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`,
        {
          root: {
            id: 0,
            name: 'page',
            children: [
              { id: 1, name: 'head' },
              { id: 2, name: 'body' },
            ]
          }
        }
      );
      assert.exists(page.root.obj);
      const root = page.root.obj;
      assert.equal(root[k.RT_ID_KEY], 0);
      assert.equal(root[k.RT_NAME_KEY], 'page');
      assert.equal((root[k.RT_DOM_KEY] as dom.Element).tagName, 'HTML');
      assert.isFalse(root[k.RT_ISOLATED_KEY]);
      assert.equal((root[k.RT_CHILDREN_KEY] as []).length, 2);
      assert.exists((root[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
      const head = root.head;
      assert.exists(head);
      assert.equal(head[k.RT_ID_KEY], 1);
      assert.equal(head[k.RT_NAME_KEY], 'head');
      assert.equal((head[k.RT_DOM_KEY] as dom.Element).tagName, 'HEAD');
      assert.isFalse(head[k.RT_ISOLATED_KEY]);
      assert.equal(head[k.RT_PARENT_KEY], root);
      assert.equal((head[k.RT_CHILDREN_KEY] as []).length, 0);
      assert.exists((head[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
      const body = root.body;
      assert.exists(body);
      assert.equal(body[k.RT_ID_KEY], 2);
      assert.equal(body[k.RT_NAME_KEY], 'body');
      assert.equal((body[k.RT_DOM_KEY] as dom.Element).tagName, 'BODY');
      assert.isFalse(body[k.RT_ISOLATED_KEY]);
      assert.equal(body[k.RT_PARENT_KEY], root);
      assert.equal((body[k.RT_CHILDREN_KEY] as []).length, 0);
      assert.exists((body[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
    });

    it('103', () => {
      const page = load(
        `<html ${k.DOM_ID_ATTR}="0"></html>`,
        {
          root: {
            id: 0,
            values: {
              x: {
                exp: function() { return 1; }
              }
            }
          }
        }
      );
      const root = page.root.obj;
      assert.equal(root.x, 1);
    });

    it('104', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`,
        {
          root: {
            id: 0,
            values: {
              x: { exp: function() { return 1; } }
            },
            children: [
              { id: 1, },
              {
                id: 2,
                name: 'body',
                values: {
                  y: {
                    // @ts-expect-error use of `this` in expression
                    exp: function() { return this.x + 1; }
                  }
                }
              },
            ]
          }
        }
      );
      const root = page.root.obj;
      const body = root.body as { y: number };
      assert.equal(body.y, 2);
    });

    it('105', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`,
        {
          root: {
            id: 0,
            values: {
              x: { exp: function() { return 1; } }
            },
            children: [
              { id: 1, },
              {
                id: 2,
                name: 'body',
                values: {
                  y: {
                    // @ts-expect-error use of `this` in expression
                    exp: function() { return this.x + 1; },
                    // @ts-expect-error use of `this` in expression
                    deps: [function() { return this[k.RT_VALUE_KEY]('x'); }]
                  }
                }
              },
            ]
          }
        }
      );
      const root = page.root.obj;
      const body = root.body as { y: number };
      assert.equal(body.y, 2);
      root.x = 3;
      assert.equal(body.y, 4);
    });

    it('106', () => {
      const page = load(`<html ${k.DOM_ID_ATTR}="0">`
        + `<head ${k.DOM_ID_ATTR}="1"></head>
        <body ${k.DOM_ID_ATTR}="2">
        </body>`
        + `</html>`,
        {
          root: {
            id: 0,
            values: {
              y: {
                // @ts-expect-error use of `this` in expression
                exp: function() { return this.body.x + 1; },
                // @ts-expect-error use of `this` in expression
                deps: [function() { return this.body[k.RT_VALUE_KEY]('x'); }]
              }
            },
            children: [
              { id: 1, },
              {
                id: 2,
                name: 'body',
                values: {
                  x: { exp: function() { return 1; } }
                }
              },
            ]
          }
        }
      );
      const root = page.root.obj;
      assert.equal(root.y, 2);
      const body = root.body as { x: number };
      assert.equal(body.x, 1);
      body.x = 3;
      assert.equal(root.y, 4);
    });

  }));
});
