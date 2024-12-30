import { assert, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { ATTR_VALUE_PREFIX, CLASS_VALUE_PREFIX, Page, SCOPE_ID_ATTR, STYLE_VALUE_PREFIX } from '../../src/web/page';

it('should create a page', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
  </html>`, 'test').doc;
  const ctx = new Page({ doc, root: { __id: '1' } });
  assert.exists(ctx.global);
  assert.exists(ctx.root);
  assert.equal(ctx.root.__view, doc.documentElement);
  assert.equal(ctx.doc, doc);
  assert.equal(ctx.global.__children[0], ctx.root);
  assert.equal(ctx.cycle, 1);
});
