import { expect, it } from 'vitest';
import { Context } from '../../../src/core/context';

it('should replicate foreach content', () => {
  const ctx = new Context({ root: {
    __children: [{
      __type: 'foreach',
      data: { e: function() { return [1, 2, 3]; } },
      __children: [{}],
    }],
  } });
  expect(ctx.root.__children.length).toBe(4);
  expect(ctx.root.__children[0]['data']).toBe(1);
  expect(ctx.root.__children[1]['data']).toBe(2);
  expect(ctx.root.__children[2]['data']).toBe(3);
  expect(ctx.root.__children[3]['data']).toEqual([1, 2, 3]);
  const foreach = ctx.root.__children[3];
  foreach['data'] = ['a', 'b'];
  expect(ctx.root.__children.length).toBe(3);
  expect(ctx.root.__children[0]['data']).toBe('a');
  expect(ctx.root.__children[1]['data']).toBe('b');
  expect(ctx.root.__children[2]['data']).toEqual(['a', 'b']);
  foreach['data'] = null;
  expect(ctx.root.__children.length).toBe(1);
});
