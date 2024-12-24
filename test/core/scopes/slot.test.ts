import { expect, it } from 'vitest';
import { Context } from '../../../src/core/context';

it('should define a slot', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        __children: [{
          __type: 'slot',
          __name: 'slot1',
        }, {
          v: { e: function() { return 21; } },
        }]
      }, {
        __proto: 'my-tag',
        __children: [{
          __slot: 'slot1',
          v: { e: function() { return 41; } },
        }]
      }],
    }
  });
  const proto = ctx.protos.get('my-tag');
  expect(ctx.root.__children.length).toBe(1);
  const inst = ctx.root.__children[0];
  //TODO
  // expect(inst.__children.length).toBe(2);
});
