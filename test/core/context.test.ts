import { describe, it, expect } from 'vitest';
import { Context } from '../../src/core/context';

it('should create a context', () => {
  const ctx = new Context({ root: {} });
  expect(ctx.global).toBeDefined();
  expect(ctx.root).toBeDefined();
  expect(ctx.global.__children[0]).toBe(ctx.root);
  expect(ctx.root.__parent).toBe(ctx.global);
  expect(ctx.cycle).toBe(1);
});
