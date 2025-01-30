import { Context, ContextProps } from '../../../src/runtime/context';
import { getDoc } from '../../util';

export function flatCtx(client: boolean) {
  const doc = getDoc('<html data-domaze="1">'
    + '<head data-domaze="2"></head>'
    + '<body data-domaze="3">'
    + '<template data-domaze="4">'
    + '<div data-domaze="5"><!---t0--><!---/t--></div>'
    + '</template>'
    + '</body>'
    + '</html>', client);
  const props: ContextProps = {
    doc,
    root: {
      __id: 0, __children: [{
        __id: 1, __children: [{
          __id: 2, __children: [],
        }, {
          __id: 3,
          __children: [{
            __id: 4,
            __type: 'foreach',
            data: { e: function() { return [1, 2, 3]; } },
            __children: [{
              __id: 5, __children: [],
              text_0: {
                e: function() { return this.data; },
                r: [function() { return this.__value('data'); }]
              }
            }],
          }],
        }],
      }],
    },
  };
  const ctx = new Context(props);
  return { doc, props, ctx, label: 'flat' };
}

export function nestedCtx(client: boolean) {
  const doc = getDoc('<html data-domaze="1">'
    + '<head data-domaze="2"></head>'
    + '<body data-domaze="3">'
    + '<template data-domaze="4">'
    + '<div data-domaze="5">'
    + '<template data-domaze="6">'
    + '<span data-domaze="7"><!---t0--><!---/t--></span>'
    + '</template>'
    + '</div>'
    + '</template>'
    + '</body>'
    + '</html>', client);
  const props: ContextProps = {
    doc,
    root: {
      __id: 0, __children: [{
        __id: 1, __children: [{
          __id: 2, __children: [],
        }, {
          __id: 3,
          __children: [{
            __id: 4,
            __type: 'foreach',
            data: { e: function() { return [1, 2, 3]; } },
            // __children: [{
            //   __id: 5, __children: [],
            //   text_0: {
            //     e: function() { return this.data; },
            //     r: [function() { return this.__value('data'); }]
            //   }
            // }],
            __children: [{
              __id: 5, __children: [{
                __id: 6,
                __type: 'foreach',
                data: { e: function() { return ['a', 'b']; } },
                __children: [{
                  __id: 7,
                  text_0: {
                    e: function() { return this.data; },
                    r: [function() { return this.__value('data'); }]
                  },
                  __children: []
                }]
              }]
            }]
          }],
        }],
      }],
    },
  };
  const ctx = new Context(props);
  return { doc, props, ctx, label: 'nested' };
}
