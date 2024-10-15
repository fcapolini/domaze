import { assert } from 'chai';
import { JSDOM } from 'jsdom';
import { describe } from 'mocha';
import { ClientPage } from '../../src/client/client-page';
import * as dom from '../../src/html/dom';
import { normalizeSpace, parse } from '../../src/html/parser';
import * as k from '../../src/runtime/consts';
import { Page, PageProps } from '../../src/runtime/page';
import { ServerPage } from '../../src/server/server-page';
import * as props from './props';

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

    // =========================================================================
    // app nodes
    // =========================================================================

    it('001', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"></html>`,
        new props.Page().add(
          new props.Scope({ id: 0 })
        ).props
      );
      assert.exists(page.root);
      assert.equal(page.root.e, page.doc.documentElement);
      assert.equal(page.root.children.length, 0);
      const html = page.global.getMarkup();
      assert.equal(
        normalizeSpace(html),
        normalizeSpace(
          `<html ${k.OUT_ID_ATTR}="0"><head></head><body></body></html>`
        )
      )
    });

    it('002', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0 })
            .add(new props.Scope({ id: 1 }))
            .add(new props.Scope({ id: 2 }))
        ).props
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
        normalizeSpace(`<html ${k.OUT_ID_ATTR}="0">`
          + `<head ${k.OUT_ID_ATTR}="1"></head>
          <body ${k.OUT_ID_ATTR}="2">
          </body>`
          + `</html>`)
      )
    });

    it('003', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' })
            .add(new props.Scope({ id: 1, name: 'head' }))
            .add(new props.Scope({ id: 2, name: 'body' }))
        ).props
      );
      assert.equal(page.root.children.length, 2);
      assert.equal(page.root.name, 'page');
      assert.equal(page.root.children[0].name, 'head');
      assert.equal(page.root.children[1].name, 'body');
      const html = page.global.getMarkup();
      assert.equal(
        normalizeSpace(html),
        normalizeSpace(`<html ${k.OUT_ID_ATTR}="0">`
          + `<head ${k.OUT_ID_ATTR}="1"></head>
          <body ${k.OUT_ID_ATTR}="2">
          </body>`
          + `</html>`)
      )
    });

    it('004', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"></html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' })
        ).props
      );
      assert.exists(page.root.obj);
      const root = page.root.obj;
      assert.equal(root[k.RT_ID_KEY], 0);
    });

    it('005', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' })
            .add(new props.Scope({ id: 1, name: 'head' }))
            .add(new props.Scope({ id: 2, name: 'body' }))
        ).props
      );
      assert.exists(page.root.obj);
      const root = page.root.obj;
      assert.equal(root[k.RT_ID_KEY], 0);
      assert.equal(root[k.RT_NAME_KEY], 'page');
      assert.equal((root[k.RT_DOM_KEY] as dom.Element).tagName, 'HTML');
      assert.isFalse(root[k.RT_ISOLATE_KEY]);
      assert.equal((root[k.RT_CHILDREN_KEY] as []).length, 2);
      assert.exists((root[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
      const head = root.head;
      assert.exists(head);
      assert.equal(head[k.RT_ID_KEY], 1);
      assert.equal(head[k.RT_NAME_KEY], 'head');
      assert.equal((head[k.RT_DOM_KEY] as dom.Element).tagName, 'HEAD');
      assert.isFalse(head[k.RT_ISOLATE_KEY]);
      assert.equal(head[k.RT_PARENT_KEY], root);
      assert.equal((head[k.RT_CHILDREN_KEY] as []).length, 0);
      assert.exists((head[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
      const body = root.body;
      assert.exists(body);
      assert.equal(body[k.RT_ID_KEY], 2);
      assert.equal(body[k.RT_NAME_KEY], 'body');
      assert.equal((body[k.RT_DOM_KEY] as dom.Element).tagName, 'BODY');
      assert.isFalse(body[k.RT_ISOLATE_KEY]);
      assert.equal(body[k.RT_PARENT_KEY], root);
      assert.equal((body[k.RT_CHILDREN_KEY] as []).length, 0);
      assert.exists((body[k.RT_VALUE_KEY] as Function)(k.RT_ID_KEY));
    });

    // =========================================================================
    // logic values
    // =========================================================================

    it('103', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"></html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' }, {
            x: { exp: function() { return 1; } }
          })
        ).props
      );
      const root = page.root.obj;
      assert.equal(root.x, 1);
    });

    it('104', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' }, {
            x: { exp: function() { return 1; } }
          }).add(
            new props.Scope({ id: 1 })
          ).add(
            new props.Scope({ id: 2, name: 'body' }, {
              // @ts-expect-error use of `this` in expression
              y: { exp: function() { return this.x + 1; } }
            })
          )
        ).props
      );
      const root = page.root.obj;
      const body = root.body as { y: number };
      assert.equal(body.y, 2);
    });

    it('105', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' }, {
            x: { exp: function() { return 1; } }
          }).add(
            new props.Scope({ id: 1 })
          ).add(
            new props.Scope({ id: 2, name: 'body' }, {
              y: {
                // @ts-expect-error use of `this` in expression
                exp: function() { return this.x + 1; },
                // @ts-expect-error use of `this` in expression
                deps: [function() { return this[k.RT_VALUE_KEY]('x'); }]
              }
            })
          )
        ).props
      );
      const root = page.root.obj;
      const body = root.body as { y: number };
      assert.equal(body.y, 2);
      root.x = 3;
      assert.equal(body.y, 4);
    });

    it('106', () => {
      const page = load(`<html ${k.OUT_ID_ATTR}="0">`
        + `<head ${k.OUT_ID_ATTR}="1"></head>
        <body ${k.OUT_ID_ATTR}="2">
        </body>`
        + `</html>`,
        new props.Page().add(
          new props.Scope({ id: 0, name: 'page' }, {
            y: {
              // @ts-expect-error use of `this` in expression
              exp: function() { return this.body.x + 1; },
              // @ts-expect-error use of `this` in expression
              deps: [function() { return this.body[k.RT_VALUE_KEY]('x'); }]
            }
          }).add(
            new props.Scope({ id: 1 })
          ).add(
            new props.Scope({ id: 2, name: 'body' }, {
              x: { exp: function() { return 1; } }
            })
          )
        ).props
      );
      const root = page.root.obj;
      assert.equal(root.y, 2);
      const body = root.body as { x: number };
      assert.equal(body.x, 1);
      body.x = 3;
      assert.equal(root.y, 4);
    });

    // =========================================================================
    // text values
    // =========================================================================

    it('201', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"><body>v: <!---t0--><!----></body</html>`,
        new props.Page().add(
          new props.Scope({ id: 0 }, {
            text$0: { exp: function() { return 'OK'; } }
          })
        ).props
      );
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0"><head></head>`
        + `<body>v: <!---t0-->OK<!----></body></html>`
      );
      page.root.obj.text$0 = 'hi';
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0"><head></head>`
        + `<body>v: <!---t0-->hi<!----></body></html>`
      );
    });

    it('202', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"><body>v: <!---t0--><!----></body</html>`,
        new props.Page().add(
          new props.Scope({ id: 0 }, {
            v: { exp: function() { return 'OK'; } },
            text$0: {
              // @ts-expect-error use of `this` in expression
              exp: function() { return this.v; },
              // @ts-expect-error use of `this` in expression
              deps: [function() { return this[k.RT_VALUE_KEY]('v'); }]
            }
          })
        ).props
      );
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0"><head></head>`
        + `<body>v: <!---t0-->OK<!----></body></html>`
      );
      page.root.obj.v = 'hi';
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0"><head></head>`
        + `<body>v: <!---t0-->hi<!----></body></html>`
      );
    });

    // =========================================================================
    // attribute values
    // =========================================================================

    it('301', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"></html>`,
        new props.Page().add(
          new props.Scope({ id: 0 }, {
            attr$lang: { exp: function() { return 'it'; }}
          })
        ).props
      );
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0" lang="it"><head></head><body></body></html>`
      );
      page.root.obj.attr$lang = 'en';
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0" lang="en"><head></head><body></body></html>`
      );
    });

    it('302', () => {
      const page = load(
        `<html ${k.OUT_ID_ATTR}="0"></html>`,
        new props.Page().add(
          new props.Scope({ id: 0 }, {
            v: { exp: function() { return 'it'; } },
            attr$lang: {
              // @ts-expect-error use of `this` in expression
              exp: function() { return this.v; },
              // @ts-expect-error use of `this` in expression
              deps: [function() { return this[k.RT_VALUE_KEY]('v'); }]
            }
          })
        ).props
      );
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0" lang="it"><head></head><body></body></html>`
      );
      page.root.obj.v = 'en';
      assert.equal(
        page.global.getMarkup(),
        `<html ${k.OUT_ID_ATTR}="0" lang="en"><head></head><body></body></html>`
      );
    });

  }));
});
