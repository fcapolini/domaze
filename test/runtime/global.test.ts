import { assert, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context } from '../../src/runtime/context';

it('should create global scope', () => {
  const source = parse('<html data-domaze="1"></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: { __id: 0, __children: [{ __id: 1, __children: [] }] }
  });
  assert.exists(ctx.global);
  assert.equal(ctx.global['console'], console);
});

it('should allow custom "console"', () => {
  const messages: string[] = [];
  const pseudoConsole = { log: (msg: string) => { messages.push(msg) } };
  const source = parse('<html data-domaze="1"></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: {
      __id: 0,
      console: { e: function() { return pseudoConsole; } },
      __children: [{
        __id: 1,
        v: { e: function () { return this.console.log('from "v"'); } },
        __children: []
      }]
    }
  });
  assert.exists(ctx.global);
  assert.equal(ctx.global['console'], pseudoConsole);
  assert.deepEqual(messages, ['from "v"']);
});
