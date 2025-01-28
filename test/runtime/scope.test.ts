import { assert, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context } from '../../src/runtime/context';

it('should create a named root scope', () => {
  const source = parse('<html></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: {
      __id: "1",
      __name: "root",
    },
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 0);
  assert.equal(ctx.global['root'], ctx.root);
});

it('should create a nested scope', () => {
  const source = parse('<html></html>', 'test');
  const ctx = new Context({
    doc: source.doc,
    root: {
      __id: "1",
      __children: [{}],
    },
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 1);
});

it('should create a nested named scope', () => {
  const source = parse('<html></html>', 'test');
  const rootName = 'page';
  const bodyName = 'body';
  const ctx = new Context({
    doc: source.doc,
    root: {
      __name: rootName,
      __children: [
        {
          __name: bodyName,
        },
      ],
    },
  });
  assert.equal(ctx.global.__children.length, 1);
  assert.equal(ctx.root.__children.length, 1);
  assert.equal(ctx.global[rootName][bodyName], ctx.root.__children[0]);
});

it('should insert a scope before another', () => {
  const source = parse('<html></html>', 'test');
  const headName = 'head';
  const bodyName = 'body';
  const ctx = new Context({
    doc: source.doc,
    root: {
      __children: [
        {
          __name: bodyName,
        },
      ],
    },
  });
  assert.equal(ctx.root.__children.length, 1);
  assert.equal(ctx.root.__children[0].__props.__name, bodyName);
  ctx.newScope({ __name: headName }, ctx.root, ctx.root.__children[0]);
  assert.equal(ctx.root.__children.length, 2);
  assert.equal(ctx.root.__children[0].__props.__name, headName);
  assert.equal(ctx.root.__children[1].__props.__name, bodyName);
});
