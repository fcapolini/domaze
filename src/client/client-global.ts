import * as dom from "../html/dom";
import * as k from "../runtime/consts";
import { Global } from "../runtime/global";

export class ClientGlobal extends Global {

  override getElement(id: number, root: dom.Element): dom.Element | null {
    return (root.ownerDocument as unknown as Document).evaluate(
      `//*[@${k.OUT_ID_ATTR}='${id}']`,
      root as unknown as Element,
      null,
      9 // XPathResult.FIRST_ORDERED_NODE_TYPE
    ).singleNodeValue as unknown as dom.Element;
  }

  override getMarkup(): string {
    const doc = this.page.doc as unknown as Document;
    return doc.documentElement.outerHTML;
  }

}
