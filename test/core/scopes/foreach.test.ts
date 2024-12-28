import { assert, it } from 'vitest';
import { Context } from '../../../src/core/context';

it('should replicate foreach content', () => {
  const ctx = new Context({ root: {
    __children: [{
      __type: 'foreach',
      data: { e: function() { return [1, 2, 3]; } },
      __children: [{}],
    }],
  } });
  assert.equal(ctx.root.__children.length, 4);
  assert.equal(ctx.root.__children[0]['data'], 1);
  assert.equal(ctx.root.__children[1]['data'], 2);
  assert.equal(ctx.root.__children[2]['data'], 3);
  assert.deepEqual(ctx.root.__children[3]['data'], [1, 2, 3]);
  const foreach = ctx.root.__children[3];
  foreach['data'] = ['a', 'b'];
  assert.equal(ctx.root.__children.length, 3);
  assert.equal(ctx.root.__children[0]['data'], 'a');
  assert.equal(ctx.root.__children[1]['data'], 'b');
  assert.deepEqual(ctx.root.__children[2]['data'], ['a', 'b']);
  foreach['data'] = null;
  assert.equal(ctx.root.__children.length, 1);
});
