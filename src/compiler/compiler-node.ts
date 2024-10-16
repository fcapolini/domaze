import * as dom from '../html/dom';
import * as k from '../runtime/consts';
import { Global } from "../runtime/global";
import { Page } from "../runtime/page";
import { Node, NodeObj, NodeValues } from "../runtime/node";
import { ValueProps } from "../runtime/value";
import { CompilerPage } from "./compiler-page";

export class CompilerNode implements Node {
  page: Page;
  parent?: Node;
  id: number;
  dom: dom.Element;
  global?: Global | undefined;
  isolate?: boolean | undefined;
  name?: string | undefined;
  type?: "foreach" | undefined;
  values: NodeValues;
  obj: NodeObj;
  children: Node[];

  constructor(page: CompilerPage, id: number, e: dom.Element) {
    this.page = page;
    this.id = id;
    this.dom = e;
    this.values = {};
    this.obj = {};
    this.children = [];
    e.setAttribute(k.OUT_ID_ATTR, `${id}`);
  }

  setName(name?: string): this {
    this.name = name;
    return this;
  }

  setValues(values?: { [key: string]: ValueProps; }): this {
    // nop
    return this;
  }

  makeObj(): this {
    // nop
    return this;
  }

  linkTo(p: Node, ref?: Node): this {
    p.children.push(this);
    this.parent = p;
    return this;
  }

  unlinkValues(): void {
    // nop
  }

  linkValues(): void {
    // nop
  }

  updateValues(): void {
    // nop
  }

  getText(id: string): dom.Text | undefined {
    // nop
    return undefined;
  }
}
