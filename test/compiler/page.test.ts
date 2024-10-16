import * as acorn from 'acorn';
import { assert } from 'chai';
import escodegen from 'escodegen';
import fs from 'fs';
import { describe } from 'mocha';
import path from 'path';
import { CompilerPage } from '../../src/compiler/compiler-page';
import * as parser from '../../src/html/parser';

const docroot = path.join(__dirname, 'page');
const inSuffix = '-in.html';
const outSuffix = '-out.html';
const propsSuffix = '-props.js';
const errSuffix = '-err.json';

describe.skip('compiler/page', () => {
  fs.readdirSync(docroot).forEach(file => {
    const inPath = path.join(docroot, file);
    if (
      fs.statSync(inPath).isFile() &&
      file.endsWith(inSuffix)
    ) {
      const name = file.substring(0, file.length - inSuffix.length);

      it(file, async () => {
        const inText = await fs.promises.readFile(inPath);
        const inSource = parser.parse(inText.toString(), file);
        assert.equal(inSource.errors.length, 0);

        const page = new CompilerPage(inSource.doc, { root: { id: 0 } });

        const errPath = path.join(docroot, name + errSuffix);
        if (fs.existsSync(errPath)) {
          const errText = await fs.promises.readFile(errPath);
          const expected = JSON.parse(errText.toString());
          const actual = page.errors.map(e => e.msg);
          assert.deepEqual(actual, expected);
        } else if (page.errors.length) {
          page.errors.forEach(e => console.error(e));
          assert.equal(page.errors.length, 0);
        }
        const root = page.root;
        assert.exists(root);
        assert.equal(root.dom, inSource.doc.documentElement);

        const outPath = path.join(docroot, name + outSuffix);
        if (fs.existsSync(outPath)) {
          const outText = await fs.promises.readFile(outPath);
          const outSource = parser.parse(outText.toString(), file);
          assert.equal(inSource.doc.toString(), outSource.doc.toString());
        }

        const propsPath = path.join(docroot, name + propsSuffix);
        if (fs.existsSync(propsPath)) {
          const propsText = (await fs.promises.readFile(propsPath)).toString();
          const propsAst = acorn.parse(propsText, { ecmaVersion: 'latest' });
          const propsJS = escodegen.generate(propsAst);
          assert.equal(
            `(${escodegen.generate(page.ast)});`,
            propsJS
          );
        }
      });

    }
  });
});
