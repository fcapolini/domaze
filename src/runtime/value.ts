import { Scope } from "./scope";

export type ValueExp = () => any;
export type ValueFun = () => any;
export type ValueDep = () => Value;
export type ValueCallback = (s: Scope, v: any) => any;

export interface ValueProps {
  e?: ValueExp;
  // f?: ValueFun;
  r?: ValueDep[];
}

export class Value {
  scope: Scope;
  props: ValueProps;
  exp?: ValueExp;
  cb?: ValueCallback;
  src: Set<Value>;
  dst: Set<Value>;
  cycle: number;
  value: any;

  constructor(scope: Scope, props: ValueProps) {
    this.scope = scope;
    this.props = props;
    // if (props.f) {
    //   this.value = props.f;
    // } else {
      this.exp = props.e;
    // }
    this.src = new Set();
    this.dst = new Set();
    this.cycle = 0;
  }

  setCB(cb?: ValueCallback): this {
    this.cb = cb;
    return this;
  }

  link() {
    this.props.r?.forEach((dep) => {
      try {
        const o = dep.apply(this.scope);
        o.dst.add(this);
        this.src.add(o);
      } catch (ignored) {}
    });
  }

  unlink() {
    this.src.forEach((o) => o.dst.delete(this));
    this.dst.forEach((o) => o.src.delete(this));
  }

  get(): any {
    if (this.cycle !== this.scope.__ctx.cycle) {
      if (!this.cycle || this.src.size) {
        return this.update();
      }
    }
    return this.value;
  }

  set(val: any): boolean {
    // if (this.props.f) {
    //   // write protect functions
    //   return false;
    // }
    const old = this.value;
    delete this.exp;
    this.src.clear();
    if (old == null ? val != null : val !== old) {
      this.value = this.cb ? this.cb(this.scope, val) : val;
      this.propagate();
    }
    return true;
  }

  protected update(): any {
    this.cycle = this.scope.__ctx.cycle;
    const old = this.value;
    try {
      this.value = this.exp!.apply(this.scope);
    } catch (err) {
      console.error(err);
    }
    if (old == null ? this.value != null : this.value !== old) {
      this.value = this.cb ? this.cb(this.scope, this.value) : this.value;
      this.dst.size && this.scope.__ctx.refreshLevel < 1 && this.propagate();
    }
    return this.value;
  }

  protected propagate() {
    const ctx = this.scope.__ctx;
    if (ctx.pushLevel < 1) {
      ctx.cycle++;
    }
    ctx.pushLevel++;
    try {
      this.dst.forEach((v) => v.get());
    } catch (ignored) { }
    ctx.pushLevel--;
  }
}
