import { assert, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context } from '../../src/runtime/context';

it('should create a context', () => {
  const source = parse('<html data-domaze="1"></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: { __id: 0, __children: [{ __id: 1, __children: [] }] }
  });
  assert.exists(ctx.global);
  assert.exists(ctx.root);
  assert.equal(ctx.global.__children[0], ctx.root);
  assert.equal(ctx.root.__parent, ctx.global);
  assert.equal(ctx.cycle, 1);
});

it('should write-protect the global object', () => {
  const source = parse('<html data-domaze="1"></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: {
      __id: 0, __children: [{
        __id: 1, __children: [],
        v1: { e: function () { return 1; } },
      }]
    }
  });
  let globalErr: any;
  let rootErr: any;
  try {
    ctx.global['console'] = null;
  } catch (err) {
    globalErr = err;
  }
  try {
    ctx.root['v1'] = null;
  } catch (err) {
    rootErr = err;
  }
  assert.exists(globalErr);
  assert.notExists(rootErr);
})
