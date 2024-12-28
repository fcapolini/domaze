import { assert, it } from 'vitest';
import { Context } from '../../src/core/context';
import { Scope } from '../../src/core/scope';
import { Value, ValueProps } from '../../src/core/value';

class CustomContext extends Context {
  values: Map<string, any>;
  counts: Map<string, number>;

  override newValue(scope: Scope, key: string, props: ValueProps): Value {
    this.values || (this.values = new Map());
    this.counts || (this.counts = new Map());
    return new Value(scope, props).setCB((_, v) => {
      this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
      this.values.set(key, v);
      return v;
    });
  }
}

it('should create a value', () => {
  const ctx = new Context({
    root: {
      v1: { e: function () { return 1; } },
    }
  });
  assert.equal(ctx.root['v1'], 1);
});

it('should create a custom value', () => {
  const ctx = new CustomContext({
    root: {
      v1: { e: function () { return 20; } },
    }
  });
  assert.equal(ctx.values.get('v1'), 20);
  assert.equal(ctx.counts.get('v1'), 1);
  ctx.root['v1'] = 20;
  assert.equal(ctx.values.get('v1'), 20);
  assert.equal(ctx.counts.get('v1'), 1);
  ctx.root['v1'] = 30;
  assert.equal(ctx.values.get('v1'), 30);
  assert.equal(ctx.counts.get('v1'), 2);
});

it('should create a dependent value', () => {
  const ctx = new Context({
    root: {
      v1: {
        e: function () { return 1; }
      },
      v2: {
        e: function () { return this.v1 + 1; },
        d: [function () { return this.__value('v1'); }]
      }
    }
  });
  assert.equal(ctx.root['v1'], 1);
  assert.equal(ctx.root['v2'], 2);
  ctx.root['v1']++;
  assert.equal(ctx.root['v1'], 2);
  assert.equal(ctx.root['v2'], 3);
});

it('should create a custom dependent value', () => {
  const ctx = new CustomContext({
    root: {
      v1: {
        e: function () { return 20; }
      },
      v2: {
        e: function () { return this.v1 + 1; },
        d: [function () { return this.__value('v1'); }]
      }
    }
  });
  assert.equal(ctx.values.get('v1'), 20);
  assert.equal(ctx.counts.get('v1'), 1);
  assert.equal(ctx.values.get('v2'), 21);
  assert.equal(ctx.counts.get('v2'), 1);
  ctx.root['v1'] = 20;
  assert.equal(ctx.values.get('v1'), 20);
  assert.equal(ctx.counts.get('v1'), 1);
  assert.equal(ctx.values.get('v2'), 21);
  assert.equal(ctx.counts.get('v2'), 1);
  ctx.root['v1'] = 30;
  assert.equal(ctx.values.get('v1'), 30);
  assert.equal(ctx.counts.get('v1'), 2);
  assert.equal(ctx.values.get('v2'), 31);
  assert.equal(ctx.counts.get('v2'), 2);
});
