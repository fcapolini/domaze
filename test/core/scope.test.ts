import { expect, it } from 'vitest';
import { Context } from '../../src/core/context';

it('should create a named root scope', () => {
  const rootName = 'page';
  const ctx = new Context({
    root: {
      __name: rootName,
    }
  });
  expect(ctx.global.__children.length).toBe(1);
  expect(ctx.root.__children.length).toBe(0);
  expect(ctx.global[rootName]).toBe(ctx.root);
});

it('should create a nested scope', () => {
  const ctx = new Context({
    root: {
      __children: [{}],
    }
  });
  expect(ctx.global.__children.length).toBe(1);
  expect(ctx.root.__children.length).toBe(1);
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
  expect(ctx.global.__children.length).toBe(1);
  expect(ctx.root.__children.length).toBe(1);
  expect(ctx.global[rootName][bodyName]).toBe(ctx.root.__children[0]);
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
  expect(ctx.root.__children.length).toBe(1);
  expect(ctx.root.__children[0].__props.__name).toBe(bodyName);
  ctx.scopeFactory({
    __name: headName,
  }).__link(ctx.root, ctx.root.__children[0]);
  expect(ctx.root.__children.length).toBe(2);
  expect(ctx.root.__children[0].__props.__name).toBe(headName);
  expect(ctx.root.__children[1].__props.__name).toBe(bodyName);
});
