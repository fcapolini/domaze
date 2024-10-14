import { Page } from './page';
import { Scope } from './scope';
import { Value } from './value';
import * as dom from '../html/dom';

export abstract class Global extends Scope {

  constructor(page: Page) {
    super(page, { id: -1 }, page.doc);
  }

  abstract setValueCB(name: string, value: Value, scope: Scope): void;

  abstract getElement(id: number, root: dom.Element): dom.Element | null;

  abstract getMarkup(): string;

}
