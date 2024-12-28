import { assert, it } from 'vitest';
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
  assert.equal(ctx.root.__children.length, 0);
  assert.equal(ctx.protos.size, 1);
  const proto = ctx.protos.get('my-tag')!;
  assert.notExists(proto['v1']);
  assert.exists(proto['f1']);
  assert.exists(proto.__values['v1']);
  assert.equal(proto.__children.length, 0);
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
  assert.equal(ctx.root.__children.length, 1);
  const proto = ctx.protos.get('my-tag')!;
  assert.exists(proto);

  // proto doesn't instantiate its own children
  assert.equal(proto.__children.length, 0);
  assert.notExists(proto['child']);

  const inst1 = ctx.root.__children[0];
  assert.equal(inst1['v1'], 1);
  assert.equal(inst1['v2'], 11);
  assert.equal(inst1['f1'](), 2);
  inst1['v1'] = 5;
  assert.equal(inst1['v2'], 15);

  // inst1 doesn't define any children, but it inherits them from proto
  assert.equal(inst1.__children.length, 1);
  assert.exists(inst1['child']);
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
  assert.equal(ctx.root.__children.length, 2);
  const inst1 = ctx.root.__children[0];
  const inst2 = ctx.root.__children[1];
  assert.equal(inst1['v2'], 11);
  assert.equal(inst2['v2'], 21);
  inst1['v1'] = 5;
  inst2['v1'] = 6;
  assert.equal(inst1['v2'], 15);
  assert.equal(inst2['v2'], 26);
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
  assert.equal(ctx.root.__children.length, 1);
  const inst1 = ctx.root.__children[0];
  assert.equal(inst1.__children.length, 2);
  assert.equal(inst1.__children[0].__props.__name, 'protoChild');
  assert.equal(inst1.__children[1].__props.__name, 'instanceChild');
  assert.exists(inst1['protoChild']);
  assert.exists(inst1['instanceChild']);
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
  assert.equal(ctx.root.__children.length, 0);
  assert.equal(ctx.protos.size, 2);
  const proto = ctx.protos.get('my-tag')!;
  assert.notExists(proto['v1']);
  assert.notExists(proto['v2']);
  assert.exists(proto['f1']);
  assert.exists(proto['f2']);
  assert.exists(proto.__values['v1']);
  assert.exists(proto.__values['v2']);
  assert.equal(proto.__children.length, 0);
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
  assert.equal(ctx.protos.size, 2);
  const baseTag = ctx.protos.get('base-tag');
  const myTag = ctx.protos.get('my-tag');
  assert.exists(baseTag);
  assert.exists(myTag);
  assert.equal(baseTag?.__children.length, 0);
  assert.equal(myTag?.__children.length, 0);
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
  assert.equal(ctx.root.__children.length, 1);
  const inst1 = ctx.root.__children[0];
  assert.equal(inst1['v0'], 100);
  assert.equal(inst1['f0'](), 200);
  assert.equal(inst1['v1'], 105);
  assert.equal(inst1['f1'](), 2);
  assert.equal(inst1['v2'], 115);
  inst1['v0'] = 300;
  assert.equal(inst1['v1'], 305);
  assert.equal(inst1['v2'], 315);

  assert.equal(inst1.__children.length, 3);
  assert.exists(inst1['baseChild']);
  assert.exists(inst1['protoChild']);
  assert.exists(inst1['instanceChild']);
  assert.equal(inst1.__children[0], inst1['baseChild']);
  assert.equal(inst1.__children[1], inst1['protoChild']);
  assert.equal(inst1.__children[2], inst1['instanceChild']);
});

//TODO: slots
