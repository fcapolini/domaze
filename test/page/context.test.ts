import { expect, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context, SCOPE_ID_ATTR } from '../../src/page/context';

it('should create a page', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
  </html>`, 'test').doc;
  const ctx = new Context({ doc, root: { __id: '1' } });
  expect(ctx.global).toBeDefined();
  expect(ctx.root).toBeDefined();
  expect(ctx.doc).toBe(doc);
  expect(ctx.global.__children[0]).toBe(ctx.root);
  expect(ctx.cycle).toBe(1);
});
