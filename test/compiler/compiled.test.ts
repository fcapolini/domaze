import { assert, describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as acorn from 'acorn';
import { JSDOM } from 'jsdom';
import { normalizeText, parse } from '../../src/html/parser';
import { Context, ContextProps } from '../../src/runtime/context';
import * as dom from '../../src/html/dom';
import { ServerDocument } from '../../src/html/server-dom';
import { Compiler } from '../../src/compiler/compiler';
import { generate } from 'escodegen';

const docroot = path.join(__dirname, 'compiled');

[false, true].forEach(client => {
  const name = client ? 'client' : 'server';

  describe(name, () => fs.readdirSync(docroot).forEach(dir => {
    const dirPath = path.join(docroot, dir);
    if (dir.startsWith('.')) return;
    if (!fs.statSync(dirPath).isDirectory()) return;
    const compiler = new Compiler({ docroot: dirPath });

    describe(dir, () => fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (!file.endsWith('-in.html')) return;
      if (!fs.statSync(filePath).isFile()) return;

      it(file, async () => {
        // compile
        const page = await compiler.compile(file);
        const js = page.code ? generate(page.code) : '';
        const root = eval(js);
        // console.log(page.source.doc.toString());
        // console.log(js);
        // console.log(page.source.errors);
        // assert.fail();
        // check loaded
        const loadedDoc = loadDoc(filePath, 'loaded');
        loadedDoc && assert.equal(
          markup(page.source.doc),
          markup(loadedDoc)
        );
        // simulate server-side execution
        const props: ContextProps = { doc: page.source.doc, root };
        let ctx = new Context(props);
        // console.log(page.source.doc.toString());
        if (client) {
          // simulate client-side execution
          const jsdom = new JSDOM(ctx.props.doc.toString());
          const doc = jsdom.window.document as unknown as dom.Document;
          const props = { doc, root };
          ctx = new Context(props);
        } else {
          // check generated JS
          const text = loadText(filePath, '.js');
          const ast = text && acorn.parse(text, {
            ecmaVersion: 'latest',
            sourceType: 'script',
          });
          text && assert.equal(
            js,
            generate(ast)
          )
        }
        // check out
        const outDoc = loadDoc(filePath, 'out');
        outDoc && assert.equal(
          markup(ctx.props.doc),
          markup(outDoc)
        );
      });

    }));

  }));

});

function loadText(
  filePath: string,
  type: string
): string | null {
  filePath = filePath.replace(/\.html$/, `${type}`);
  try {
    const text = fs.readFileSync(filePath).toString();
    return text;
  } catch (ignored) {}
  return null;
}

function loadDoc(
  filePath: string,
  type: string,
  nr?: number
): ServerDocument | null {
  filePath = filePath.replace(/-in\.html$/, `-${type}${nr ?? ""}.html`);
  try {
    const html = fs.readFileSync(filePath).toString();
    const source = parse(html, "test");
    return source.doc;
  } catch (ignored) {}
  return null;
}

function markup(doc: dom.Document | Document) {
  let html = doc instanceof ServerDocument
    ? doc.toString()
    : (doc.documentElement as HTMLElement).outerHTML;
  html = html
    .replace(/><head/g, '>\n<head')
    .replace(/><\/html/g, '>\n</html');
  return normalizeText(html);
}
