import * as dom from '../../html/dom';
import { Global } from "../global";
import { Page } from "../page";
import { ScopeProps } from "../scope";
import { BaseScope } from "./base-scope";

export class ForeachScope extends BaseScope {
  constructor(page: Page, props: ScopeProps, e: dom.Element, global?: Global) {
    super(page, { ...props, type: 'foreach' }, e, global);
  }
}
