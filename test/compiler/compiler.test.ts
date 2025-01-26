import fs from 'fs';
import { assert, describe, it } from 'vitest';
import path from 'path';
import { Compiler } from '../../src/compiler/compiler';
import { normalizeText } from '../../src/html/parser';
import { CompilerScope } from '../../src/compiler/loader';
import * as acorn from 'acorn';
import { generate } from 'escodegen';

const docroot = path.join(__dirname, 'compiler');

fs.readdirSync(docroot).forEach(dir => {
  const dirPath = path.join(docroot, dir);
  if (
    fs.statSync(dirPath).isDirectory() &&
    !dir.startsWith('.')
  ) {

    describe(dir, () => {
      const compiler = new Compiler({ docroot: dirPath });

      fs.readdirSync(dirPath).forEach(file => {
        if (
          fs.statSync(path.join(dirPath, file)).isFile() &&
          file.endsWith('-in.html')
        ) {

          it(file, async () => {
            const page = await compiler.compile(file);
            const source = page.source;
            // check errors
            if (source.errors.length) {
              const errpname = file.replace('-in.html', '-err.json');
              const pname = path.join(dirPath, errpname);
              const aerrs = source.errors.map(e => e.msg);
              let eerrs = [];
              try {
                const etext = (await fs.promises.readFile(pname)).toString();
                eerrs = JSON.parse(etext);
                assert.deepEqual(aerrs, eerrs);
              } catch (e) {
                assert.deepEqual(aerrs, eerrs);
              }
              return;
            }
            // check output markup
            {
              const actualHTML = source.doc!.toString() + '\n';
              const outpname = path.join(docroot, dir, file.replace('-in.', '-out.'));
              const expectedHTML = await fs.promises.readFile(outpname, { encoding: 'utf8' });
              assert.equal(normalizeText(actualHTML), normalizeText(expectedHTML));
            }
            // check compiler scopes
            const jsonpname = path.join(docroot, dir, file.replace('-in.html', '-out.json'));
            if (fs.existsSync(jsonpname)) {
              const text = await fs.promises.readFile(jsonpname, { encoding: 'utf8' });
              const root = JSON.parse(text);
              const cleanup = (scope: CompilerScope) => {
                delete (scope as any).loc;
                scope.children.forEach(s => cleanup(s));
              };
              page.root && cleanup(page.root);
              assert.deepEqual(page.root, root);
            }
            // check generated code
            // const jspname = path.join(docroot, dir, file.replace('-in.html', '-out.js'));
            // if (fs.existsSync(jspname)) {
            //   const text = await fs.promises.readFile(jspname, { encoding: 'utf8' });
            //   const ast = acorn.parse(text, { ecmaVersion: 'latest' });
            //   const expected = generate(ast);
            //   const actual = generate(page.code);
            //   assert.equal(actual, expected);
            // }
          });

        }
      });
    });

  }
});
