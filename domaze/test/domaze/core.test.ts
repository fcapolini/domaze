import { describe, it, expect } from "vitest";
import { Context } from "../../src/domaze/core";

describe("core", () => {

  it("accepts empty app", () => {
    const ctx = new Context({});
    expect(ctx.global.root).toBeDefined();
    expect(ctx.global.root.children).toHaveLength(0);
  });

  it("accepts root value", () => {
    const ctx = new Context({ values: { foo: { exp: () => 'bar' } } });
    expect(ctx.global.root).toBeDefined();
    expect(ctx.global.root.values).toHaveProperty('foo');
  });

  it("accepts named root", () => {
    const ctx = new Context({ name: 'page' });
    expect(ctx.global.root).toBeDefined();
    expect(ctx.global.values).toHaveProperty("page");
    expect(ctx.global.values.page.props.exp()).toBe(ctx.global.root);
  });

});
