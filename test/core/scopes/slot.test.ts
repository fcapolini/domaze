import { expect, it } from 'vitest';
import { Context } from '../../../src/core/context';
import { Scope } from '../../../src/core/scope';

it('should define a slot', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        __children: [{
          __name: 'protoChild1',
          __children: [{
            __type: 'slot',
            __name: 'slot1',
          }]
        }, {
          __name: 'protoChild2',
          v: { e: function() { return 21; } },
        }]
      }, {
        __proto: 'my-tag',
        __children: [{
          __slot: 'slot1',
          __name: 'instChild',
          v: { e: function() { return 41; } },
        }]
      }],
    }
  });
  const proto = ctx.protos.get('my-tag');
  expect(ctx.root.__children.length).toBe(1);
  const inst = ctx.root.__children[0];
  //TODO
  expect(inst.__children.length).toBe(2);
  // console.log(JSON.stringify(dump(inst), undefined, 2));
  expect(JSON.stringify(dump(inst), undefined, 2)).toEqual(JSON.stringify({
    "proto": "my-tag",
    "children": [
      {
        "name": "protoChild1",
        "children": [
          {
            "name": "instChild",
            "values": "v"
          },
          {
            "type": "slot",
            "name": "slot1"
          }
        ]
      },
      {
        "name": "protoChild2",
        "values": "v"
      }
    ]
  }, undefined, 2));
});

function dump(scope: Scope): any {
  const f = (scope: Scope, level = 0) => {
    const values = [
      ...(Reflect.ownKeys(scope.__props) as string[])
        .filter(s => !s.startsWith('__'))
    ];
    return {
      type: scope.__props.__type,
      name: scope.__props.__name,
      proto: scope.__props.__proto,
      values: values.length ? values.join(', ') : undefined,
      children: scope.__children.length
        ? [...scope.__children.map(child => f(child))]
        : undefined,
    }
  }
  return f(scope);
}
