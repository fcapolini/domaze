import { assert, expect, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context, SCOPE_ID_ATTR } from '../../src/page/context';

it('should create a page', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
  </html>`, 'test').doc;
  const ctx = new Context({ doc, root: { __id: '1' } });
  assert.exists(ctx.global);
  assert.exists(ctx.root);
  assert.equal(ctx.doc, doc);
  assert.equal(ctx.global.__children[0], ctx.root);
  assert.equal(ctx.cycle, 1);
});
