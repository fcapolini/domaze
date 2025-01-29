import { generate } from 'escodegen';
import fs from 'fs';
import path from 'path';
import { assert, describe, it } from 'vitest';
import { Compiler } from '../../src/compiler/compiler';
import { normalizeText } from '../../src/html/parser';
import { Context } from '../../src/runtime/context';
import { cleanupScopes } from '../util';

const docroot = path.join(__dirname, 'runtime');

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
            // actual page
            const page = await compiler.compile(file);
            page.source.doc.toString();//tempdebug
            const code = eval(generate(page.code));
            const ctx = new Context({
              doc: page.source.doc,
              root: code
            });

            // expected descriptor
            const descrfile = file.replace('-in.html', '-out.json');
            const descrpath = path.join(docroot, dir, descrfile);
            if (fs.existsSync(descrpath)) {
              const exproot = JSON.parse(fs.readFileSync(descrpath).toString());
              const actroot = JSON.parse(JSON.stringify(cleanupScopes(page.root!)));
              assert.deepEqual(actroot, exproot);
            }

            // expected page
            const expfile = file.replace('-in', '-out');
            const exppath = path.join(docroot, dir, expfile);
            let exp = (await fs.promises.readFile(exppath)).toString();
            exp = normalizeText(exp)!;
            let act = page.source.doc.toString();
            act = act.replace(/ data-domaze="\d+"/g, '');
            act = act.replace(/<!---.*?-->/g, '');
            act = normalizeText(act)!;
            assert.equal(act.trim(), exp.trim());
          });

        }
      });
    });

  }
});
