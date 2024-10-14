import { Page } from './page';
import { Scope } from './scope';
import { Value } from './value';
import * as dom from '../html/dom';
import * as k from './consts';

export abstract class Global extends Scope {

  constructor(page: Page) {
    super(page, { id: -1 }, page.doc);
  }

  abstract getElement(id: number, root: dom.Element): dom.Element | null;

  abstract getMarkup(): string;

  setValueCB(name: string, value: Value, scope: Scope) {
    if (name.startsWith(k.RT_ATTR_VALUE_PREFIX)) {
      const key = name.substring(k.RT_ATTR_VALUE_PREFIX.length);
      value.cb = (scope, v) => {
        scope.e.setAttribute(key, `${v != null ? v : ''}`);
        return v;
      };
    } else if (name.startsWith(k.RT_TEXT_VALUE_PREFIX)) {
      const key = name.substring(k.RT_TEXT_VALUE_PREFIX.length);
      const t = scope.getText(key)!;
      value.cb = (_, v) => {
        t.textContent = `${v != null ? v : ''}`;
        return v;
      };
    }
  }

}
