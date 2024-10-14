import { Page } from "./page";
import { Scope } from "./scope";

export interface ValueProps {
  exp: ValueExp;
  deps?: ValueDep[];
}

export type ValueExp = (this: unknown) => unknown;
export type ValueDep = (this: unknown) => Value;
export type ValueCallback = (s: Scope, v: unknown) => unknown;

export class Value {
  page: Page;
  scope: Scope;
  props: ValueProps;
  src: Set<Value>;
  dst: Set<Value>;
  exp?: ValueExp;
  cb?: ValueCallback;
  cycle = -1;
  val: unknown;

  constructor(page: Page, scope: Scope, props: ValueProps) {
    this.page = page;
    this.scope = scope;
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
      this.val = this.cb ? this.cb(this.scope, val) : val;
      this.propagate();
    }
  }

  update() {
    if (this.cycle !== this.page.cycle && this.exp) {
      this.cycle = this.page.cycle;
      const old = this.val;
      try {
        this.val = this.exp.apply(this.scope.obj);
      } catch (err) {
        //TODO runtime logging
        console.error(err);
      }
      if (old == null ? this.val != null : this.val !== old) {
        this.val = this.cb ? this.cb(this.scope, this.val) : this.val;
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
