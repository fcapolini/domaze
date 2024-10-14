import * as dom from '../html/dom';
import { Page } from "./page";
import { Value, ValueProps } from "./value";

export type ScopeType = 'foreach';

export interface ScopeProps {
  id: number;
  name?: string;
  type?: ScopeType;
  values?: { [key: string]: ValueProps };
  children?: ScopeProps[];
}

export type ScopeValues = { [key: string]: Value };
export type ScopeObj = { [key: string]: unknown };

export class Scope {
  page: Page;
  props: ScopeProps;
  e: dom.Element;
  values: ScopeValues;
  obj!: ScopeObj;
  name?: string;
  parent?: Scope;
  children: Scope[];

  constructor(page: Page, props: ScopeProps, e: dom.Element) {
    this.page = page;
    this.props = props;
    this.e = e;
    this.values = {};
    this.children = [];
  }

  setName(name?: string): this {
    this.name = name;
    return this;
  }

  setValues(values?: { [key: string]: ValueProps }): this {
    return this;
  }

  makeObj(): this {
    return this;
  }

  linkTo(p: Scope, ref?: Scope): this {
    let i = ref ? p.children.indexOf(ref) : -1;
    i = i < 0 ? p.children.length : i;
    p.children.splice(i, 0, this);
    this.parent = p;
    !this.e.parentElement
      && this.e.tagName !== 'HTML'
      && p.e.insertBefore(this.e, ref?.e ?? null);
    if (this.name) {
      if (!p.values[this.name]) {
        const that = this;
        // add name to parent scope
        p.values[this.name] = new Value(this.page, p, {
          exp: function() { return that.obj; }
        });
      }
    }
    //tempdebug
    // this.page.global.addEventListeners(this);
    // this.linkValues();
    return this;
  }

  unlink(): this {
    //tempdebug
    // this.unlinkValues();
    // this.page.global.removeEventListeners(this);
    if (this.name && this.parent && this.parent.obj[this.name] === this.obj) {
      // remove name from parent scope
      delete this.parent.values[this.name];
    }
    this.e.unlink();
    const i = this.parent ? this.parent.children.indexOf(this) : -1;
    i >= 0 && this.parent!.children.splice(i, 1);
    delete this.parent;
    return this;
  }

}
