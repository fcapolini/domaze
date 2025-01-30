import { assert, describe, it } from 'vitest';
import { Context } from '../../../src/runtime/context';
import { getMarkup } from '../../util';
import { flatCtx, nestedCtx } from './foreach-util';

[false, true].forEach(client => {
  describe(client ? 'client' : 'server', () => {
    describe('flat', () => {

      it('should replicate foreach content', () => {
        const { ctx } = flatCtx(client);
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
          + '<div data-domaze="5:0"><!---t0-->1<!---/t--></div>'
          + '<div data-domaze="5:1"><!---t0-->2<!---/t--></div>'
          + '<div data-domaze="5:2"><!---t0-->3<!---/t--></div>'
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

      it.skip('should reuse existing clones in the DOM', () => {
        const { props } = flatCtx(client);
        const ctx = new Context(props);
        assert.equal(
          getMarkup(ctx.props.doc, false),
          '<html data-domaze="1">'
          + '<head data-domaze="2"></head>'
          + '<body data-domaze="3">'
          + '<div data-domaze="5:0"><!---t0-->1<!---/t--></div>'
          + '<div data-domaze="5:1"><!---t0-->2<!---/t--></div>'
          + '<div data-domaze="5:2"><!---t0-->3<!---/t--></div>'
          + '<template data-domaze="4">'
          + '<div data-domaze="5"><!---t0--><!---/t--></div>'
          + '</template>'
          + '</body>'
          + '</html>'
        )
        const body = ctx.root.__children[1];
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

    describe.skip('nested', () => {

      it('should replicate foreach content', () => {
        const { ctx } = nestedCtx(client);
        const body = ctx.root.__children[1];
        console.log(body.__view.toString());//tempdebug
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

          + '<div data-domaze="5:0">'
          + '<span data-domaze="7:0"><!---t0-->a<!---/t--></span>'
          + '<span data-domaze="7:1"><!---t0-->b<!---/t--></span>'
          + '<template data-domaze="6">'
          + '<span data-domaze="7"><!---t0--><!---/t--></span>'
          + '</template>'
          + '</div>'

          + '<div data-domaze="5:1">'
          + '<span data-domaze="7:0"><!---t0-->a<!---/t--></span>'
          + '<span data-domaze="7:1"><!---t0-->b<!---/t--></span>'
          + '<template data-domaze="6">'
          + '<span data-domaze="7"><!---t0--><!---/t--></span>'
          + '</template>'
          + '</div>'

          + '<div data-domaze="5:2">'
          + '<span data-domaze="7:0"><!---t0-->a<!---/t--></span>'
          + '<span data-domaze="7:1"><!---t0-->b<!---/t--></span>'
          + '<template data-domaze="6">'
          + '<span data-domaze="7"><!---t0--><!---/t--></span>'
          + '</template>'
          + '</div>'

          + '<template data-domaze="4">'
          + '<div data-domaze="5">'
          + '<template data-domaze="7">'
          + '<span data-domaze="7"><!---t0--><!---/t--></span>'
          + '</template>'
          + '</div>'
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

      it.skip('should reuse existing clones in the DOM', () => {
        const { props } = nestedCtx(client);
        const ctx = new Context(props);
        assert.equal(
          getMarkup(ctx.props.doc, false),
          '<html data-domaze="1">'
          + '<head data-domaze="2"></head>'
          + '<body data-domaze="3">'
          + '<div data-domaze="5:0"><!---t0-->1<!---/t--></div>'
          + '<div data-domaze="5:1"><!---t0-->2<!---/t--></div>'
          + '<div data-domaze="5:2"><!---t0-->3<!---/t--></div>'
          + '<template data-domaze="4">'
          + '<div data-domaze="5"><!---t0--><!---/t--></div>'
          + '</template>'
          + '</body>'
          + '</html>'
        )
        const body = ctx.root.__children[1];
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
});
