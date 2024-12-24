import { expect, it } from 'vitest';
import { Context } from '../../../src/core/context';

it('should define a component', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        v1: { e: function() { return 1; } },
        f1: { f: function() { return 2; } },
        __children: [{
          __name: 'protoChild'
        }]
      }],
    }
  });
  expect(ctx.root.__children.length).toBe(0);
  expect(ctx.protos.size).toBe(1);
  const proto = ctx.protos.get('my-tag')!;
  expect(proto['v1']).toBeUndefined();
  expect(proto['f1']).toBeDefined();
  expect(proto.__values['v1']).toBeDefined();
  expect(proto.__children.length).toBe(0);
});

it('should instantiate a component', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        v1: { e: function() { return 1; } },
        f1: { f: function() { return 2; } },
        __children: [{
          __name: 'child',
        }]
      }, {
        __proto: 'my-tag',
        v2: {
          e: function() { return this.v1 + 10; },
          d: [function() { return this.__value('v1'); }],
        }
      }],
    }
  });
  expect(ctx.root.__children.length).toBe(1);
  const proto = ctx.protos.get('my-tag')!;
  expect(proto).toBeDefined();

  // proto doesn't instantiate its own children
  expect(proto.__children.length).toBe(0);
  expect(proto['child']).toBeUndefined();

  const inst1 = ctx.root.__children[0];
  expect(inst1['v1']).toBe(1);
  expect(inst1['v2']).toBe(11);
  expect(inst1['f1']()).toBe(2);
  inst1['v1'] = 5;
  expect(inst1['v2']).toBe(15);

  // inst1 doesn't define any children, but it inherits them from proto
  expect(inst1.__children.length).toBe(1);
  expect(inst1['child']).toBeDefined();
});

it("should keep inherited instances' values apart", () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        v1: { e: function () { return 1; } },
        f1: { f: function () { return 2; } },
        __children: [{
          __name: 'child',
        }]
      }, {
        __proto: 'my-tag',
        v2: {
          e: function () { return this.v1 + 10; },
          d: [function () { return this.__value('v1'); }],
        }
      }, {
        __proto: 'my-tag',
        v2: {
          e: function () { return this.v1 + 20; },
          d: [function () { return this.__value('v1'); }],
        }
      }],
    }
  });
  expect(ctx.root.__children.length).toBe(2);
  const inst1 = ctx.root.__children[0];
  const inst2 = ctx.root.__children[1];
  expect(inst1['v2']).toBe(11);
  expect(inst2['v2']).toBe(21);
  inst1['v1'] = 5;
  inst2['v1'] = 6;
  expect(inst1['v2']).toBe(15);
  expect(inst2['v2']).toBe(26);
});

it('should populate a component', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'my-tag',
        v1: { e: function () { return 1; } },
        f1: { f: function () { return 2; } },
        __children: [{
          __name: 'protoChild',
        }]
      }, {
        __proto: 'my-tag',
        v2: {
          e: function () { return this.v1 + 10; },
          d: [function () { return this.__value('v1'); }],
        },
        __children: [{
          __name: 'instanceChild',
        }]
      }],
    }
  });
  expect(ctx.root.__children.length).toBe(1);
  const inst1 = ctx.root.__children[0];
  expect(inst1.__children.length).toBe(2);
  expect(inst1.__children[0].__props.__name).toBe('protoChild');
  expect(inst1.__children[1].__props.__name).toBe('instanceChild');
  expect(inst1['protoChild']).toBeDefined();
  expect(inst1['instanceChild']).toBeDefined();
});

it('should define an extended component (1)', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'base-tag',
        v1: { e: function() { return 10; } },
        v2: { e: function() { return 11; } },
        f1: { f: function() { return 20; } },
        __children: [{
          __name: 'baseChild'
        }]
      }, {
        __type: 'define',
        __name: 'my-tag',
        __proto: 'base-tag',
        v1: { e: function() { return 11; } },
        f1: { f: function() { return 21; } },
        f2: { f: function() { return 22; } },
        __children: [{
          __name: 'protoChild'
        }]
      }],
    }
  });
  expect(ctx.root.__children.length).toBe(0);
  expect(ctx.protos.size).toBe(2);
  const proto = ctx.protos.get('my-tag')!;
  expect(proto['v1']).toBeUndefined();
  expect(proto['v2']).toBeUndefined();
  expect(proto['f1']).toBeDefined();
  expect(proto['f2']).toBeDefined();
  expect(proto.__values['v1']).toBeDefined();
  expect(proto.__values['v2']).toBeDefined();
  expect(proto.__children.length).toBe(0);
});

it('should define an extended component (2)', () => {
  const ctx = new Context({
    root: {
      __children: [{
        __type: 'define',
        __name: 'base-tag',
        v0: { e: function() { return 100; }},
        f0: { f: function() { return 200; }},
        __children: [{
          __name: 'baseChild',
        }]
      }, {
        __type: 'define',
        __name: 'my-tag',
        __proto: 'base-tag',
        v1: {
          e: function() { return this.v0 + 5; },
          d: [function() { return this.__value('v0'); }],
        },
        f1: { f: function() { return 2; } },
        __children: [{
          __name: 'child',
        }]
      }, {
        __proto: 'my-tag',
        v2: {
          e: function() { return this.v1 + 10; },
          d: [function() { return this.__value('v1'); }],
        },
        __children: [{
          __name: 'instanceChild',
        }]
      }],
    }
  });
  expect(ctx.protos.size).toBe(2);
  const baseTag = ctx.protos.get('base-tag');
  const myTag = ctx.protos.get('my-tag');
  expect(baseTag).toBeDefined();
  expect(myTag).toBeDefined();
  expect(baseTag?.__children.length).toBe(0);
  expect(myTag?.__children.length).toBe(0);
});

it('should instantiate an extended definition', () => {
  const ctx = new Context({
    root: {
      __children: [
        {
          __type: 'define',
          __name: 'base-tag',
          v0: { e: function() { return 100; }},
          f0: { f: function() { return 200; }},
          __children: [{
            __name: 'baseChild',
          }]
        },
        {
          __type: 'define',
          __name: 'my-tag',
          __proto: 'base-tag',
          v1: {
            e: function() { return this.v0 + 5; },
            d: [function() { return this.__value('v0'); }],
          },
          f1: { f: function() { return 2; } },
          __children: [{
            __name: 'protoChild',
          }]
        },
        {
          __proto: 'my-tag',
          v2: {
            e: function() { return this.v1 + 10; },
            d: [function() { return this.__value('v1'); }],
          },
          __children: [{
            __name: 'instanceChild',
          }]
        }
      ],
    }
  });
  expect(ctx.root.__children.length).toBe(1);
  const inst1 = ctx.root.__children[0];
  expect(inst1['v0']).toBe(100);
  expect(inst1['f0']()).toBe(200);
  expect(inst1['v1']).toBe(105);
  expect(inst1['f1']()).toBe(2);
  expect(inst1['v2']).toBe(115);
  inst1['v0'] = 300;
  expect(inst1['v1']).toBe(305);
  expect(inst1['v2']).toBe(315);

  expect(inst1.__children.length).toBe(3);
  expect(inst1['baseChild']).toBeDefined();
  expect(inst1['protoChild']).toBeDefined();
  expect(inst1['instanceChild']).toBeDefined();
  expect(inst1.__children[0]).toBe(inst1['baseChild']);
  expect(inst1.__children[1]).toBe(inst1['protoChild']);
  expect(inst1.__children[2]).toBe(inst1['instanceChild']);
});

//TODO: slots
