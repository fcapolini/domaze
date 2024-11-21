import { describe, it, expect } from "vitest";
import { Context, RT_VALUE_FN } from "../../src/domaze/core";

describe("core", () => {

  describe('context', () => {

    it("accepts empty app", () => {
      const ctx = new Context({});
      expect(ctx.root).toBeDefined();
      expect(ctx.root.children).toHaveLength(0);
    });

    it("accepts root value", () => {
      const ctx = new Context({
        values: {
          foo: { exp: function() { return 'bar'; } }
        }
      });
      expect(ctx.root).toBeDefined();
      expect(ctx.root.values).toHaveProperty('foo');
    });

    it("accepts named root", () => {
      const ctx = new Context({ name: 'page' });
      expect(ctx.root).toBeDefined();
      expect(ctx.global.values).toHaveProperty("page");
      expect(ctx.global.values.page.props.exp()).toBe(ctx.root);
    });

  });

  // describe("global", () => {});

  // describe('scope', () => {});

  describe("value", () => {

    it("001", () => {
      const ctx = new Context({
        values: {
          v1: { exp: function () { return 1; } },
        },
      });
      expect(ctx.root.obj.v1).toBe(1);
    });

    it("002", () => {
      const ctx = new Context({
        values: {
          v1: { exp: function () { return 1; } },
          v2: { exp: function () { return this.v1 + 1; } },
        },
      });
      expect(ctx.root.obj.v2).toBe(2);
    });

    it("101", () => {
      const ctx = new Context({
        values: {
          v1: {
            exp: function () { return 1; },
          },
          v2: {
            exp: function () { return this.v1 + 1; },
            deps: [function() { return this[RT_VALUE_FN]("v1"); }]
          },
        },
      });
      expect(ctx.cycle).toBe(1);
      expect(ctx.root.obj.v2).toBe(2);
      ctx.root.obj.v1 = 2;
      expect(ctx.cycle).toBe(2);
      expect(ctx.root.values.v2.curr).toBe(3);
    });

    it("201", () => {
      const counts = { v1: 0 };
      const values = { v1: null };
      const ctx = new Context({
        values: {
          v1: { exp: function () { return 1; } },
        },
      }, (key, val) => {
        val.cb = (_, v) => (counts[key]++, values[key] = v);
      });
      expect(counts.v1).toBe(1);
      expect(values.v1).toBe(1);
      expect(ctx.root.obj.v1).toBe(1);
      ctx.root.obj.v1 = 10;
      expect(counts.v1).toBe(2);
      expect(values.v1).toBe(10);
      expect(ctx.root.obj.v1).toBe(10);
    });

    it("202", () => {
      const counts = { v1: 0, v2: 0 };
      const values = { v1: null, v2: 0 };
      const ctx = new Context({
        values: {
          v1: {
            exp: function () { return 1; }
          },
          v2: {
            exp: function () { return this.v1 + 1; },
            deps: [function() { return this[RT_VALUE_FN]("v1"); }]
          },
        },
      }, (key, val) => {
        val.cb = (_, v) => (counts[key]++, values[key] = v);
      });
      expect(counts.v2).toBe(1);
      expect(values.v2).toBe(2);
      expect(ctx.root.obj.v2).toBe(2);
      ctx.root.obj.v1 = 10;
      expect(counts.v2).toBe(2);
      expect(values.v2).toBe(11);
      expect(ctx.root.obj.v2).toBe(11);
    });

  });

});
