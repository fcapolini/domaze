import { assert, describe, it } from 'vitest';
import { Context } from '../../../src/runtime/context';
import { getDoc, getMarkup } from '../../util';

[false].forEach(client => {
  describe(client ? 'client' : 'server', () => {

    it('should replicate foreach content', () => {
      const doc = getDoc('<html data-domaze="1">'
        + '<head data-domaze="2"></head>'
        + '<body data-domaze="3">'
        + '<template data-domaze="4">'
        + '<div data-domaze="5"><!---t0--><!---/t--></div>'
        + '</template>'
        + '</body>'
        + '</html>', client);
      const ctx = new Context({
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
      });
      const body = ctx.root.__children[1];
      assert.equal(body.__children.length, 4);
      assert.equal(body.__children[0]['data'], 1);
      assert.equal(body.__children[1]['data'], 2);
      assert.equal(body.__children[2]['data'], 3);
      assert.deepEqual(body.__children[3]['data'], [1, 2, 3]);
      assert.equal(
        getMarkup(ctx.props.doc, false),
        '<html data-domaze="1">'
        + '<head data-domaze="2"></head>'
        + '<body data-domaze="3">'
        + '<div data-domaze="5[0]"><!---t0-->1<!---/t--></div>'
        + '<div data-domaze="5[1]"><!---t0-->2<!---/t--></div>'
        + '<div data-domaze="5[2]"><!---t0-->3<!---/t--></div>'
        + '<template data-domaze="4">'
        + '<div data-domaze="5"><!---t0--><!---/t--></div>'
        + '</template>'
        + '</body>'
        + '</html>'
      )
      const foreach = body.__children[3];
      foreach['data'] = ['a', 'b'];
      assert.equal(body.__children.length, 3);
      assert.equal(body.__children[0]['data'], 'a');
      assert.equal(body.__children[1]['data'], 'b');
      assert.deepEqual(body.__children[2]['data'], ['a', 'b']);
      foreach['data'] = null;
      assert.equal(body.__children.length, 1);
    });

  });
});
