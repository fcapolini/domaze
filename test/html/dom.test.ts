import { describe } from 'mocha';

// const docroot = path.join(__dirname, 'dom');

// async function load(fname: string, client: boolean): Promise<dom.Document> {
//   const text = await fs.promises.readFile(path.join(docroot, fname));
//   const ret = client
//     ? new JSDOM(text.toString()).window.document as unknown as dom.Document
//     : parse(text.toString(), '').doc;
//   return ret;
// }

// function child(e: dom.Element, tagName: string): dom.Element | null {
//   for (const n of e.childNodes) {
//     if (n.nodeType === ELEMENT_NODE && (n as dom.Element).tagName === tagName) {
//       return n as dom.Element;
//     }
//   }
//   return null;
// }

// function lookup(e: dom.Element | null, tagNames: string[]): dom.Element | null {
//   tagNames.forEach(tagName => e = e && child(e, tagName));
//   return e;
// }

// function markup(e: dom.Element, client: boolean): string {
//   if (client) {
//     return (e as unknown as Element).outerHTML;
//   }
//   return (e as ServerElement).toString();
// }

describe('html/dom', () => {
  for (let i = 0; i < 2; i++) {
    const client = i < 1;

    describe(client ? 'client' : 'server', () => {

      // it('template001', async () => {
      //   const doc = await load('template001.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.exists(fragment);
      //   assert.equal(fragment.childNodes.length, 0);
      // });

      // it('template002', async () => {
      //   const doc = await load('template002.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.equal(fragment.childNodes.length, 1);
      //   const div = lookup(fragment, ['DIV']);
      //   assert.exists(div);
      // });

      // it('template003', async () => {
      //   const doc = await load('template003.html', client);
      //   const template = lookup(doc, ['HTML', 'BODY', 'TEMPLATE']);
      //   const fragment = (template as dom.TemplateElement).content;
      //   assert.equal(fragment.childNodes.length, 3);
      //   const div = lookup(fragment, ['DIV']);
      //   assert.exists(div);
      // });

      // it('template004', async () => {
      //   const doc = await load('template004.html', client);
      //   const body = lookup(doc, ['HTML', 'BODY']);
      //   const template = lookup(body, ['TEMPLATE']) as dom.TemplateElement;
      //   const clone = template.content.cloneNode(true);
      //   body?.insertBefore(clone, template);
      //   const div = lookup(body, ['DIV']);
      //   assert.exists(div);
      //   assert.equal(div.nodeType, ELEMENT_NODE);
      //   assert.equal(
      //     normalizeSpace(markup(body!, client)),
      //     normalizeSpace(`<body>
      //       <div></div><template><div></div></template>
      //     </body>`)
      //   )
      // });

    });

  }
});
