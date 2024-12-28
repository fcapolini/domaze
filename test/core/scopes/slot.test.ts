import { assert, it } from 'vitest';
import { Context } from '../../../src/core/context';
import { dump } from '../util';

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
          }, {
            __name: 'protoChild2'
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
  assert.equal(ctx.root.__children.length, 1);
  const inst = ctx.root.__children[0];
  assert.equal(dump(inst), JSON.stringify({
    "proto": "my-tag",
    "children": [
      {
        "name": "protoChild1",
        "children": [
          { "name": "instChild", "values": "v" },
          { "name": "protoChild2" }
        ]
      },
      { "name": "protoChild2", "values": "v" }
    ]
  }, undefined, 2));
});

it('should consider slot in extended proto', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'base-tag',
        __children: [{
          __name: 'baseChild1',
          __children: [{
            __type: 'slot',
            __name: 'slot1',
          }, {
            __name: 'baseChild2',
          }]
        }]
      }, {
        __type: 'define',
        __name: 'proto-tag',
        __proto: 'base-tag',
        __children: [{
          __name: 'protoChild',
          __slot: 'slot1'
        }]
      }, {
        __proto: 'proto-tag',
        __children: [{
          __name: 'instanceChild',
          __slot: 'slot1'
        }]
      }],
    }
  });
  assert.equal(dump(ctx.root), JSON.stringify({
    "children": [
      {
        "proto": "proto-tag",
        "children": [
          {
            "name": "baseChild1",
            "children": [
              { "name": "protoChild" },
              { "name": "instanceChild" },
              { "name": "baseChild2" },
            ]
          },
        ]
      }
    ]
  }, undefined, 2));
});

it('should replace slot in extended proto', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'base-tag',
        __children: [{
          __name: 'baseChild1',
          __children: [{
            __type: 'slot',
            __name: 'slot1',
          }, {
            __name: 'baseChild2',
          }]
        }]
      }, {
        __type: 'define',
        __name: 'proto-tag',
        __proto: 'base-tag',
        __children: [{
          __name: 'protoChild',
          __slot: 'slot1',
          __children: [{
            __type: 'slot',
            __name: 'slot1',
          }]
        }]
      }, {
        __proto: 'proto-tag',
        __children: [{
          __slot: 'slot1',
          __name: 'instanceChild',
        }]
      }],
    }
  });
  assert.equal(dump(ctx.root), JSON.stringify({
    "children": [
      {
        "proto": "proto-tag",
        "children": [
          {
            "name": "baseChild1",
            "children": [
              {
                "name": "protoChild",
                "children": [
                  { "name": "instanceChild" },
                ]
              },
              { "name": "baseChild2" },
            ]
          },
        ]
      }
    ]
  }, undefined, 2));
});
