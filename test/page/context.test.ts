import { expect, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context } from '../../src/page/context';

it('should create a page', () => {
  const doc = parse(`<html>
  </html>`, 'test').doc;
  const ctx = new Context({ doc, root: {} });
  expect(ctx.global).toBeDefined();
  expect(ctx.root).toBeDefined();
  expect(ctx.global.__children[0]).toBe(ctx.root);
  expect(ctx.root.__parent).toBe(ctx.global);
  expect(ctx.cycle).toBe(1);
});
