import { Page } from './page';
import { Node } from './node';
import { Value } from './value';
import * as dom from '../html/dom';
import * as k from './consts';
import { BaseNode } from './nodes/base-node';

function camelToDash(s: string): string {
  return s.replace(/([a-z][A-Z])/g, (g) => g[0] + '-' + g[1].toLowerCase());
}

export abstract class Global extends BaseNode {

  constructor(page: Page) {
    super(page, { id: -1 }, page.doc);
  }

  abstract getElement(id: number, root: dom.Element): dom.Element | null;

  abstract getMarkup(): string;

  setValueCB(name: string, value: Value, node: Node) {
    if (name.startsWith(k.RT_TEXT_VALUE_PREFIX)) {
      const key = name.substring(k.RT_TEXT_VALUE_PREFIX.length);
      const t = node.getText(key)!;
      value.cb = (_, v) => {
        t.textContent = `${v != null ? v : ''}`;
        return v;
      };
    } else if (name.startsWith(k.RT_ATTR_VALUE_PREFIX)) {
      const key = name.substring(k.RT_ATTR_VALUE_PREFIX.length);
      value.cb = (node, v) => {
        node.dom.setAttribute(key, `${v != null ? v : ''}`);
        return v;
      };
    } else if (name.startsWith(k.RT_CLASS_VALUE_PREFIX)) {
      const key = name.substring(k.RT_CLASS_VALUE_PREFIX.length);
      value.cb = (node, v) => {
        v ? node.dom.classList.add(key)
          : node.dom.classList.remove(key)
        return v;
      };
    } else if (name.startsWith(k.RT_STYLE_VALUE_PREFIX)) {
      const key = camelToDash(name.substring(k.RT_STYLE_VALUE_PREFIX.length));
      value.cb = (node, v) => {
        v ? node.dom.style.setProperty(key, `${v}`)
          : node.dom.style.removeProperty(key);
        return v;
      };
    }
  }

  addEventListeners(node: BaseNode) {
    this.foreachListener(node, (evname, listener) => {
      node.dom.addEventListener(evname, listener);
    });
  }

  removeEventListeners(node: BaseNode) {
    this.foreachListener(node, (evname, listener) => {
      node.dom.removeEventListener(evname, listener);
    });
  }

  foreachListener(node: Node, cb: (ev: string, listener: unknown) => void) {
    Object.keys(node.values).forEach(key => {
      if (!key.startsWith(k.RT_EVENT_VALUE_PREFIX)) {
        return;
      }
      const evname = key.substring(k.RT_EVENT_VALUE_PREFIX.length);
      const listener = node.values[key].get();
      cb(evname, listener);
    });
  }
}
