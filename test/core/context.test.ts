import { assert, it } from 'vitest';
import { Context } from '../../src/core/context';

it('should create a context', () => {
  const ctx = new Context({ root: {} });
  assert.exists(ctx.global);
  assert.exists(ctx.root);
  assert.equal(ctx.global.__children[0], ctx.root);
  assert.equal(ctx.root.__parent, ctx.global);
  assert.equal(ctx.cycle, 1);
});

it('should write-protect the global object', () => {
  const ctx = new Context({ root: { v1: { e: function() { return 1; } } } });
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
