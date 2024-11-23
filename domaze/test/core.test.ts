import { describe, expect, it } from 'vitest';
import { Context, Global, SCOPE, Scope, Value, ValueProps } from '../src/core';
import { dumpScopes } from './core.utils';

describe('core', () => {
  describe('context', () => {
    it('accepts empty app', () => {
      const ctx = new Context({});
      expect(ctx.root).toBeDefined();
      expect(ctx.root.children).toHaveLength(0);
    });

    it('accepts root value', () => {
      const ctx = new Context({
        values: {
          foo: {
            exp: function () {
              return 'bar';
            },
          },
        },
      });
      expect(ctx.root).toBeDefined();
      expect(ctx.root.values).toHaveProperty('foo');
    });

    it('accepts named root', () => {
      const ctx = new Context({ name: 'page' });
      expect(ctx.root).toBeDefined();
      expect(ctx.global.values).toHaveProperty('page');
      expect(ctx.global.values.page.props.exp()).toBe(ctx.root.obj);
    });
  });

  describe('value', () => {
    it('001', () => {
      const ctx = new Context({
        values: {
          v1: {
            exp: function () {
              return 1;
            },
          },
        },
      });
      expect(ctx.root.obj.v1).toBe(1);
    });

    it('002', () => {
      const ctx = new Context({
        values: {
          v1: {
            exp: function () {
              return 1;
            },
          },
          v2: {
            exp: function () {
              return this.v1 + 1;
            },
          },
        },
      });
      expect(ctx.root.obj.v2).toBe(2);
    });

    it('101', () => {
      const ctx = new Context({
        values: {
          v1: {
            exp: function () {
              return 1;
            },
          },
          v2: {
            exp: function () {
              return this.v1 + 1;
            },
            deps: [
              function () {
                return this[SCOPE.VALUE_FN]('v1');
              },
            ],
          },
        },
      });
      expect(ctx.cycle).toBe(1);
      expect(ctx.root.obj.v2).toBe(2);
      ctx.root.obj.v1 = 2;
      expect(ctx.cycle).toBe(2);
      expect(ctx.root.values.v2.curr).toBe(3);
    });

    it('201', () => {
      const counts = { v1: 0 };
      const values = { v1: null };
      const ctx = new Context(
        {
          values: {
            v1: {
              exp: function () {
                return 1;
              },
            },
          },
        },
        {
          valueFactory: (key: string, scope: Scope, props: ValueProps) => {
            return new Value(scope, props).setCB((_, val) => {
              return counts[key]++, (values[key] = val);
            });
          },
        }
      );
      expect(counts.v1).toBe(1);
      expect(values.v1).toBe(1);
      expect(ctx.root.obj.v1).toBe(1);
      ctx.root.obj.v1 = 10;
      expect(counts.v1).toBe(2);
      expect(values.v1).toBe(10);
      expect(ctx.root.obj.v1).toBe(10);
    });

    it('202', () => {
      const counts = { v1: 0, v2: 0 };
      const values = { v1: null, v2: 0 };
      const ctx = new Context(
        {
          values: {
            v1: {
              exp: function () {
                return 1;
              },
            },
            v2: {
              exp: function () {
                return this.v1 + 1;
              },
              deps: [
                function () {
                  return this[SCOPE.VALUE_FN]('v1');
                },
              ],
            },
          },
        },
        {
          valueFactory: (key: string, scope: Scope, props: ValueProps) => {
            return new Value(scope, props).setCB((_, val) => {
              return counts[key]++, (values[key] = val);
            });
          },
        }
      );
      expect(counts.v2).toBe(1);
      expect(values.v2).toBe(2);
      expect(ctx.root.obj.v2).toBe(2);
      ctx.root.obj.v1 = 10;
      expect(counts.v2).toBe(2);
      expect(values.v2).toBe(11);
      expect(ctx.root.obj.v2).toBe(11);
    });
  });

  describe('global', () => {
    it('should accept global `console` property', () => {
      const log = new Array<string>();
      const ctx = new Context(
        {},
        {
          globalFactory: (ctx, props) => {
            return new Global(ctx, props, {
              values: {
                console: {
                  exp: function () {
                    return {
                      log: (...args: string[]) => log.push(args.join(' ')),
                    };
                  },
                },
              },
            });
          },
        }
      );
      ctx.global.obj.console.log('hi there!');
      expect(log).toMatchObject(['hi there!']);
    });

    it('should make global `console` visible', () => {
      const log = new Array<string>();
      new Context(
        {
          values: {
            v1: {
              exp: function () {
                this.console.log('hi there!');
              },
            },
          },
        },
        {
          globalFactory: (ctx, props) => {
            return new Global(ctx, props, {
              values: {
                console: {
                  exp: function () {
                    return {
                      log: (...args: string[]) => log.push(args.join(' ')),
                    };
                  },
                },
              },
            });
          },
        }
      );
      expect(log).toMatchObject(['hi there!']);
    });
  });

  describe('foreach', () => {
    it('should accept empty foreach', () => {
      const ctx = new Context({
        children: [
          {
            name: 'foreachScope',
            type: 'foreach',
            values: {
              data: {
                exp: function () {
                  return ['a', 'b'];
                },
              },
            },
          },
        ],
      });

      expect(ctx.root.children.length).toBe(1);
      expect(ctx.root.children[0].props.type).toBe('foreach');
    });

    it('should accept empty foreach data', () => {
      const ctx = new Context({
        children: [
          {
            name: 'foreachScope',
            type: 'foreach',
            children: [{}],
          },
        ],
      });

      expect(ctx.root.children.length).toBe(1);
      expect(ctx.root.children[0].props.type).toBe('foreach');
    });

    it('should replicate foreach content', () => {
      const ctx = new Context({
        children: [
          {
            name: 'foreachScope',
            type: 'foreach',
            values: {
              data: {
                exp: function () {
                  return ['a', 'b'];
                },
              },
            },
            children: [{}],
          },
        ],
      });

      expect(ctx.root.children.length).toBe(3);
      expect(ctx.root.children[0].props.type).toBeUndefined();
      expect(ctx.root.children[0].obj.data).toBe('a');
      expect(ctx.root.children[1].props.type).toBeUndefined();
      expect(ctx.root.children[1].obj.data).toBe('b');
      expect(ctx.root.children[2].props.type).toBe('foreach');
    });

    it('should reflect foreach data changes', () => {
      const ctx = new Context({
        children: [
          {
            name: 'foreachScope',
            type: 'foreach',
            values: {
              data: {
                exp: function () {
                  return ['a', 'b'];
                },
              },
            },
            children: [{}],
          },
        ],
      });

      ctx.root.obj['foreachScope'].data = ['x', 'y', 'x'];
      expect(ctx.root.children.length).toBe(4);
      expect(ctx.root.children[0].obj.data).toBe('x');
      expect(ctx.root.children[1].obj.data).toBe('y');
      expect(ctx.root.children[2].obj.data).toBe('x');
      expect(ctx.root.children[3].props.type).toBe('foreach');

      ctx.root.obj['foreachScope'].data = ['a'];
      expect(ctx.root.children.length).toBe(2);
      expect(ctx.root.children[0].obj.data).toBe('a');
      expect(ctx.root.children[1].props.type).toBe('foreach');

      ctx.root.obj['foreachScope'].data = null;
      expect(ctx.root.children.length).toBe(1);
      expect(ctx.root.children[0].props.type).toBe('foreach');

      ctx.root.obj['foreachScope'].data = ['a'];
      expect(ctx.root.children.length).toBe(2);
      expect(ctx.root.children[0].obj.data).toBe('a');
      expect(ctx.root.children[1].props.type).toBe('foreach');
    });

    it('should support nested foreach scopes', () => {
      const ctx = new Context({
        children: [
          {
            type: 'foreach',
            values: {
              data: {
                exp: function () {
                  return [
                    ['a', 'b'],
                    ['x', 'y'],
                  ];
                },
              },
            },
            children: [
              {
                type: 'foreach',
                children: [{}],
              },
            ],
          },
        ],
      });
      expect(dumpScopes(ctx)).toEqual([
        'scope 0 "a"',
        'scope 1 "b"',
        'foreach 0 ["a","b"]',
        '  scope null null',
        'scope 0 "x"',
        'scope 1 "y"',
        'foreach 1 ["x","y"]',
        '  scope null null',
        'foreach null [["a","b"],["x","y"]]',
        '  foreach null null',
        '    scope null null',
      ]);
    });

    it('should reflect nested foreach data changes', () => {
      const ctx = new Context({
        children: [
          {
            name: 'mainForeach',
            type: 'foreach',
            values: {
              data: {
                exp: function () {
                  return [
                    ['a', 'b'],
                    ['x', 'y'],
                  ];
                },
              },
            },
            children: [
              {
                type: 'foreach',
                children: [{}],
              },
            ],
          },
        ],
      });
      ctx.root.obj.mainForeach.data = [
        ['_a', '_b', '_c'],
        ['_x', '_y', '_z'],
      ];
      expect(dumpScopes(ctx)).toEqual([
        'scope 0 "_a"',
        'scope 1 "_b"',
        'scope 2 "_c"',
        'foreach 0 ["_a","_b","_c"]',
        '  scope null null',
        'scope 0 "_x"',
        'scope 1 "_y"',
        'scope 2 "_z"',
        'foreach 1 ["_x","_y","_z"]',
        '  scope null null',
        'foreach null [["_a","_b","_c"],["_x","_y","_z"]]',
        '  foreach null null',
        '    scope null null',
      ]);
      ctx.root.obj.mainForeach.data = [['_x']];
      expect(dumpScopes(ctx)).toEqual([
        'scope 0 "_x"',
        'foreach 0 ["_x"]',
        '  scope null null',
        'foreach null [["_x"]]',
        '  foreach null null',
        '    scope null null',
      ]);
    });
  });

  // describe("component", () => {

  //   it("should accept component definition", () => {
  //     const ctx = new Context({
  //       children: [
  //         {
  //           type: "component",
  //           name: "comp1",
  //           children: [{}],
  //         },
  //       ],
  //     });

  //   });

  // });
});
