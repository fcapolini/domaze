import { assert, it } from 'vitest';
import { Context } from '../../src/core/context';

it('should create a named root scope', () => {
  const rootName = 'page';
  const ctx = new Context({
    root: {
      __name: rootName,
    }
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 0);
  assert.equal(ctx.global[rootName], ctx.root);
});

it('should create a nested scope', () => {
  const ctx = new Context({
    root: {
      __children: [{}],
    }
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 1);
});

it('should create a nested named scope', () => {
  const rootName = 'page';
  const bodyName = 'body';
  const ctx = new Context({
    root: {
      __name: rootName,
      __children: [{
        __name: bodyName,
      }],
    }
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 1);
  assert.equal(ctx.global[rootName][bodyName], ctx.root.__children[0]);
});

it('should insert a scope before another', () => {
  const headName = 'head';
  const bodyName = 'body';
  const ctx = new Context({
    root: {
      __children: [{
        __name: bodyName,
      }],
    }
  });
  assert.equal(ctx.root.__children.length, 1);
  assert.equal(ctx.root.__children[0].__props.__name, bodyName);
  ctx.newScope({ __name: headName }, ctx.root, ctx.root.__children[0]);
  assert.equal(ctx.root.__children.length, 2);
  assert.equal(ctx.root.__children[0].__props.__name, headName);
  assert.equal(ctx.root.__children[1].__props.__name, bodyName);
});
