import { assert, it } from 'vitest';
import { parse } from '../../../src/html/parser';
import { ServerTemplateElement } from '../../../src/html/server-dom';
import { Context, SCOPE_ID_ATTR } from '../../../src/page/context';
import { Define } from '../../../src/page/scopes/define';

it('should define a component', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
    <head ${SCOPE_ID_ATTR}="2">
      <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
        text
      </div></template>
    </head>
    <body ${SCOPE_ID_ATTR}="5">
    </body>
  </html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1', __name: 'page', __children: [{
      __id: '2', __name: 'head', __children: [{
        __id: '3', __type: 'define', __name: 'comp1', __children: [{
          __id: '4', attr_a: { e: function() { return 'x'; }}
        }]
      }]
    }, {
      __id: '4', __name: 'body',
    }]
  } });
  assert.equal(ctx.protos.size, 1);
  const comp1 = ctx.protos.get('comp1') as Define;
  assert.exists(comp1.__dom);
  assert.instanceOf(comp1.__dom, ServerTemplateElement);
  assert.equal(doc.toString(), `<html ${SCOPE_ID_ATTR}="1">
    <head ${SCOPE_ID_ATTR}="2">
      <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
        text
      </div></template>
    </head>
    <body ${SCOPE_ID_ATTR}="5">
    </body>
  </html>`);
});
