import { expect, it } from 'vitest';
import { Context } from '../../src/core/context';

it('should create a context', () => {
  const ctx = new Context({ root: {} });
  expect(ctx.global).toBeDefined();
  expect(ctx.root).toBeDefined();
  expect(ctx.global.__children[0]).toBe(ctx.root);
  expect(ctx.root.__parent).toBe(ctx.global);
  expect(ctx.cycle).toBe(1);
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
  expect(globalErr).toBeDefined();
  expect(rootErr).toBeUndefined();
})
