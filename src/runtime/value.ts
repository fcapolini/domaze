import { Page } from "./page";
import { Node } from "./node";

export interface ValueProps {
  exp: ValueExp;
  deps?: ValueDep[];
}

export type ValueExp = (this: unknown) => unknown;
export type ValueDep = (this: unknown) => Value;
export type ValueCallback = (s: Node, v: unknown) => unknown;

export class Value {
  page: Page;
  node: Node;
  props: ValueProps;
  src: Set<Value>;
  dst: Set<Value>;
  exp?: ValueExp;
  cb?: ValueCallback;
  cycle = -1;
  val: unknown;

  constructor(page: Page, node: Node, props: ValueProps) {
    this.page = page;
    this.node = node;
    this.props = props;
    this.src = new Set();
    this.dst = new Set();
    this.exp = props.exp;
  }

  get(): unknown {
    this.update();
    return this.val;
  }

  set(val: unknown) {
    const old = this.val;
    this.exp = undefined;
    if (old == null ? val != null : val !== old) {
      this.val = this.cb ? this.cb(this.node, val) : val;
      this.propagate();
    }
  }

  update() {
    if (this.cycle !== this.page.cycle && this.exp) {
      this.cycle = this.page.cycle;
      const old = this.val;
      try {
        this.val = this.exp.apply(this.node.obj);
      } catch (err) {
        //TODO runtime logging
        console.error(err);
      }
      if (old == null ? this.val != null : this.val !== old) {
        this.val = this.cb ? this.cb(this.node, this.val) : this.val;
        this.dst.size && this.page.refreshLevel < 1 && this.propagate();
      }
    }
  }

  propagate() {
    const page = this.page;
    if (page.pushLevel < 1) {
      page.cycle++;
    }
    page.pushLevel++;
    try {
      this.dst.forEach(v => v.update());
    } catch (ignored) { /* nop */ }
    page.pushLevel--;
  }
}
