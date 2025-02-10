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
    fs.readdirSync(docroot).forEach(file => {
      const pathname = fs.statSync(path.join(docroot, file));
      if (pathname.isFile() && file.endsWith('-in.html')) {

        it('should replicate scope', () => {
          const actual = loadActual(file, client);
          const expected = loadExpected(file);
          assert.equal(
            normalizeText(markup(actual.props.doc)),
            normalizeText(markup(expected)),
          );
        });

      }
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

function loadExpected(inHtmlFile: string): dom.Document {
  // -out.html
  const outHtmlFile = inHtmlFile.replace(/-in\.html$/, '-out.html');
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
