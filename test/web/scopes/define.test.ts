import { assert, it } from 'vitest';
import { parse } from '../../../src/html/parser';
import { ATTR_VALUE_PREFIX, CLASS_VALUE_PREFIX, Page, SCOPE_ID_ATTR, STYLE_VALUE_PREFIX } from '../../../src/web/page';

it.skip('should define a component', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
    <head ${SCOPE_ID_ATTR}="2">
      <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
      </div></template>
    </head>
    <body ${SCOPE_ID_ATTR}="5">
    </body>
  </html>`, 'test').doc;
  const ctx = new Page({ doc, root: {
    __name: 'page', __children: [{
        __name: 'head', __children: [{
          __type: 'define', __name: 'proto1',
          attr_class: { e: function() { return 'a'; } },
          f1: { f: function() { return 2; } },
        }]
      }, {
        __name: 'body',
      }],
  } });
  const proto1 = ctx.protos.get('proto1');
  assert.equal(proto1?.__view.tagName, 'TEMPLATE');
  assert.equal(
    doc.toString(), `<html ${SCOPE_ID_ATTR}="1">
    <head ${SCOPE_ID_ATTR}="2">
      <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
      </div></template>
    </head>
    <body ${SCOPE_ID_ATTR}="5">
    </body>
  </html>`
  );
});

// it('should instantiate a component', () => {
//   const doc = parse(`<html ${SCOPE_ID_ATTR}="1">
//     <head ${SCOPE_ID_ATTR}="2">
//       <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
//       </div></template>
//     </head>
//     <body ${SCOPE_ID_ATTR}="5">
//       <proto1 ${SCOPE_ID_ATTR}="6"></proto1>
//     </body>
//   </html>`, 'test').doc;
//   new Page({ doc, root: {
//     __name: 'page', __children: [{
//         __name: 'head', __children: [{
//           __type: 'define', __name: 'proto1',
//           attr_class: { e: function() { return 'a'; } },
//           f1: { f: function() { return 2; } },
//         }],
//       }, {
//         __name: 'body', __children: [{
//           __proto: 'proto1',
//         }],
//       }],
//   } });
//   assert.equal(
//     doc.toString(), `<html ${SCOPE_ID_ATTR}="1">
//     <head ${SCOPE_ID_ATTR}="2">
//       <template ${SCOPE_ID_ATTR}="3"><div ${SCOPE_ID_ATTR}="4">
//       </div></template>
//     </head>
//     <body ${SCOPE_ID_ATTR}="5">
//       <div ${SCOPE_ID_ATTR}="6"></div>
//     </body>
//   </html>`
//   );
// });
