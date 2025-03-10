import { assert, describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { normalizeText, parse } from '../../../src/html/parser';
import { Context, ContextProps } from '../../../src/runtime/context';
import * as dom from '../../../src/html/dom';
import { ServerDocument } from '../../../src/html/server-dom';

const docroot = path.join(__dirname, 'foreach');

[false, true].forEach(client => {
  describe(client ? 'client' : 'server', () => {

    describe('should replicate scope', () => {
      const file = '001-in.html';

      it('should create clones', () => {
        const ctx = loadActual(file, client);
        const expected = loadExpected(file, 1);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should decrease clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [ 'a', 'b' ];
        const expected = loadExpected(file, 2);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should increase clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [ 'a', 'b', 'c', 'd' ];
        const expected = loadExpected(file, 3);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should remove clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        const expected = loadExpected(file, 4);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should recreate clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        ctx.root['page']['data'] = [ 'a', 'b', 'c', 'd' ];
        const expected = loadExpected(file, 3);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

    });

    describe('should support 2 nested replications', () => {
      const file = '002-in.html';

      it('should create nested clones', () => {
        const ctx = loadActual(file, client);
        const expected = loadExpected(file, 1);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should increase nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [['a', 'b', 'c'], ['d', 'e']];
        const expected = loadExpected(file, 2);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should decrease nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [['a']];
        const expected = loadExpected(file, 3);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should remove nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        const expected = loadExpected(file, 4);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should recreate nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        ctx.root['page']['data'] = [['a', 'b', 'c'], ['d', 'e']];
        const expected = loadExpected(file, 2);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

    });

    describe('should support 3 nested replications', () => {
      const file = '003-in.html';

      it('should create nested clones', () => {
        const ctx = loadActual(file, client);
        const expected = loadExpected(file, 1);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should increase nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [[['a', 'b', 'c'], ['d', 'e']], [['f', 'g'], ['h']]];
        const expected = loadExpected(file, 2);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should decrease nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = [[['a'], ['b']]];
        const expected = loadExpected(file, 3);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should remove nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        const expected = loadExpected(file, 4);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

      it('should recreate nested clones', () => {
        const ctx = loadActual(file, client);
        ctx.root['page']['data'] = null;
        ctx.root['page']['data'] = [[['a', 'b', 'c'], ['d', 'e']], [['f', 'g'], ['h']]];
        const expected = loadExpected(file, 2);
        assert.equal(
          normalizeText(markup(ctx.props.doc)),
          normalizeText(markup(expected)),
        );
      });

    });

  });
});

function loadActual(inHtmlFile: string, client: boolean): Context {
  // -in.html
  const inHtml = fs.readFileSync(path.join(docroot, inHtmlFile)).toString();
  const inDoc = parse(inHtml, 'test').doc!;
  // -in.js
  const inJsFile = inHtmlFile.replace(/\.html$/, '.js');
  const inJs = fs.readFileSync(path.join(docroot, inJsFile)).toString();
  const inRoot = eval(inJs);
  const props: ContextProps = { doc: inDoc, root: inRoot };
  const ctx = new Context(props);
  // client mode
  if (client) {
    const jsdom = new JSDOM(ctx.props.doc.toString());
    const clientDoc = jsdom.window.document as unknown as dom.Document;
    const clientProps = { doc: clientDoc, root: inRoot };
    const clientCtx = new Context(clientProps);
    return clientCtx;
  }
  return ctx;
}

function loadExpected(inHtmlFile: string, nr: number): dom.Document {
  // -out.html
  const outHtmlFile = inHtmlFile.replace(/-in\.html$/, `-out-${nr}.html`);
  const outHtml = fs.readFileSync(path.join(docroot, outHtmlFile)).toString();
  const outDoc = parse(outHtml, 'test').doc!;
  return outDoc;
}

function markup(doc: dom.Document | Document) {
  let html = doc instanceof ServerDocument
    ? doc.toString()
    : (doc.documentElement as HTMLElement).outerHTML;
  return html
    .replace(/><head/g, '>\n<head')
    .replace(/><\/html/g, '>\n</html');
}
