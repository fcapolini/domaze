import { Page } from './page';
import { Scope } from './scope';
import { Value } from './value';
import * as dom from '../html/dom';
import * as k from './consts';

function camelToDash(s: string): string {
  return s.replace(/([a-z][A-Z])/g, (g) => g[0] + '-' + g[1].toLowerCase());
}

export abstract class Global extends Scope {

  constructor(page: Page) {
    super(page, { id: -1 }, page.doc);
  }

  abstract getElement(id: number, root: dom.Element): dom.Element | null;

  abstract getMarkup(): string;

  setValueCB(name: string, value: Value, scope: Scope) {
    if (name.startsWith(k.RT_TEXT_VALUE_PREFIX)) {
      const key = name.substring(k.RT_TEXT_VALUE_PREFIX.length);
      const t = scope.getText(key)!;
      value.cb = (_, v) => {
        t.textContent = `${v != null ? v : ''}`;
        return v;
      };
    } else if (name.startsWith(k.RT_ATTR_VALUE_PREFIX)) {
      const key = name.substring(k.RT_ATTR_VALUE_PREFIX.length);
      value.cb = (scope, v) => {
        scope.dom.setAttribute(key, `${v != null ? v : ''}`);
        return v;
      };
    } else if (name.startsWith(k.RT_CLASS_VALUE_PREFIX)) {
      const key = name.substring(k.RT_CLASS_VALUE_PREFIX.length);
      value.cb = (scope, v) => {
        v ? scope.dom.classList.add(key)
          : scope.dom.classList.remove(key)
        return v;
      };
    } else if (name.startsWith(k.RT_STYLE_VALUE_PREFIX)) {
      const key = camelToDash(name.substring(k.RT_STYLE_VALUE_PREFIX.length));
      value.cb = (scope, v) => {
        v ? scope.dom.style.setProperty(key, `${v}`)
          : scope.dom.style.removeProperty(key);
        return v;
      };
    }
  }

  addEventListeners(scope: Scope) {
    this.foreachListener(scope, (evname, listener) => {
      scope.dom.addEventListener(evname, listener);
    });
  }

  removeEventListeners(scope: Scope) {
    this.foreachListener(scope, (evname, listener) => {
      scope.dom.removeEventListener(evname, listener);
    });
  }

  foreachListener(scope: Scope, cb: (ev: string, listener: unknown) => void) {
    Object.keys(scope.values).forEach(key => {
      if (!key.startsWith(k.RT_EVENT_VALUE_PREFIX)) {
        return;
      }
      const evname = key.substring(k.RT_EVENT_VALUE_PREFIX.length);
      const listener = scope.values[key].get();
      cb(evname, listener);
    });
  }
}
