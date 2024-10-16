import * as dom from "../html/dom";
import * as k from "../runtime/consts";
import { Global } from "../runtime/global";
import { Page, PageProps } from "../runtime/page";

export class ServerGlobal extends Global {
  pageProps: PageProps;
  js?: string;

  constructor(page: Page, pageProps: PageProps) {
    super(page);
    this.pageProps = pageProps;
  }

  override getElement(id: number, root: dom.Element): dom.Element | null {
    const s = `${id}`;
    let ret;
    function f(e: dom.Element): dom.Element | null {
      if (e.getAttribute(k.OUT_ID_ATTR) === s) {
        return e;
      }
      for (const n of e.childNodes) {
        if (n.nodeType !== dom.NodeType.ELEMENT) {
          continue;
        }
        if ((ret = f(n as dom.Element)) !== null) {
          return ret;
        }
      }
      return null;
    }
    return f(root);
  }

  override getMarkup(): string {
    return this.page.doc.toString();
  }

}
