import fs from 'fs';
import { assert, describe, it } from 'vitest';
import path from 'path';
import { Compiler, CompilerProp, CompilerScope, CompilerValue } from '../../src/compiler/compiler';
import { normalizeText } from '../../src/html/parser';
import * as acorn from 'acorn';
import { generate } from 'escodegen';

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
            const page = await compiler.compile(file);
            //TODO
          });

        }
      });
    });

  }
});
