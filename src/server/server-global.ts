import * as dom from "../html/dom";
import { Global } from "../runtime/global";
import { Scope } from "../runtime/scope";
import { Value } from "../runtime/value";
import * as k from "../runtime/consts";
import { ELEMENT_NODE } from "trillo/preprocessor/dom";

export class ServerGlobal extends Global {

  override getElement(id: number, root: dom.Element): dom.Element | null {
    const s = `${id}`;
    let ret;
    function f(e: dom.Element): dom.Element | null {
      if (e.getAttribute(k.DOM_ID_ATTR) === s) {
        return e;
      }
      for (const n of e.childNodes) {
        if (n.nodeType !== ELEMENT_NODE) {
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
