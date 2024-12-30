import { assert, describe, expect, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Page, SCOPE_ID_ATTR } from '../../src/core/page';

describe('page', () => {

  it('should create a page', () => {
    const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
    </html>`, 'test').doc;
    const ctx = new Page({ doc, root: { __id: '1' } });
    assert.exists(ctx.global);
    assert.exists(ctx.root);
    assert.equal(ctx.doc, doc);
    assert.equal(ctx.global.__children[0], ctx.root);
    assert.equal(ctx.cycle, 1);
  });

});

// describe('scope', () => {

//   it('should create root', () => {
//     const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
//     const ctx = new Page({ doc, root: { __id: '1' } });
//     const root = ctx.root;
//     assert.equal(root.__parent, ctx.global);
//     assert.equal(root.__view, doc.documentElement);
//     assert.equal(ctx.cycle, 1);
//     assert.equal(
//       doc.toString(),
//       `<html ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
//     );
//   });

// });
