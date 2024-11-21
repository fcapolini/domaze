export const RT_VALUE_FN = '$value';

// =============================================================================
// Context
// =============================================================================

export class Context {
  global: Global;
  root: Scope;
  didAddValue?: (key: string, val: Value) => void;
  cycle = 0;
  refreshLevel = 0;
  pushLevel = 0;

  constructor(
    props: ScopeProps,
    didAddValue?: (key: string, val: Value) => void
  ) {
    this.didAddValue = didAddValue;
    this.global = new Global(this, props);
    this.root = this.global.root;
    this.refresh(this.root);
  }

  refresh(scope: Scope, nextCycle = true) {
    this.refreshLevel++;
    try {
      nextCycle && this.cycle++;
      scope.unlinkValues();
      scope.linkValues();
      scope.updateValues();
    } catch (err) {
      console.error("Context.refresh()", err);
    }
    this.refreshLevel--;
  }
}

// =============================================================================
// Scope
// =============================================================================

export interface ScopeProps {
  id?: string;
  name?: string;
  values?: { [key: string]: ValueProps };
  children?: ScopeProps[];
}

type ScopeValues = { [key: string]: Value };

class Scope {
  ctx: Context;
  props: ScopeProps;
  values: ScopeValues;
  parent: Scope | null;
  children: Scope[];
  cache: Map<string, Value>;
  obj: any;

  constructor(ctx: Context, parent: Scope | null, props: ScopeProps) {
    this.ctx = ctx;
    this.props = props;

    this.values = {};
    props.values &&
      Reflect.ownKeys(props.values).forEach((key) => {
        if (typeof key === "string") {
          this.addValue(key, props.values![key]);
        }
      });
    this.addValue(RT_VALUE_FN, {
      exp: () => (key: string) => this.values[key],
    });
    if ((this.parent = parent) && props.name) {
      parent.addValue(props.name, { exp: () => this });
    }

    this.children = props.children
      ? props.children.map((childProps) => new Scope(ctx, this, childProps))
      : [];

    this.cache = new Map();
    this.obj = new Proxy(this.values, {

      get: (_, key: string | symbol) => {
        if (typeof key === "symbol") {
          return undefined;
        }
        const v = this.cache.get(key) || this.lookupValue(key);
        return v?.get();
      },

      set: (_, key: string | symbol, val: any) => {
        if (typeof key === "symbol" || !this.parent /* is global scope */) {
          return false;
        }
        const v = this.cache.get(key) || this.lookupValue(key);
        return v?.set(val) ?? false;
      },

      defineProperty: () => false,

      deleteProperty: () => false,
      
    });
  }

  unlinkValues(recur = true) {
    this.cache.clear();
    this.foreachValue((v) => {
      v.src.forEach((o) => o.dst.delete(v));
      v.dst.forEach((o) => o.src.delete(v));
    });
    recur && this.children.forEach((s) => s.unlinkValues());
  }

  linkValues(recur = true) {
    this.foreachValue((v) => {
      v.props.deps?.forEach((dep) => {
        try {
          const o = dep.apply(this.obj);
          o.dst.add(v);
          v.src.add(o);
        } catch (ignored) {
          /* nop */
        }
      });
    });
    recur && this.children.forEach((s) => s.linkValues());
  }

  updateValues(recur = true) {
    this.foreachValue((v) => v.get());
    recur && this.children.forEach((s) => s.updateValues());
  }

  protected foreachValue(cb: (v: Value) => void) {
    const values = this.values;
    (Reflect.ownKeys(values) as string[]).forEach((k) => cb(values[k]));
  }

  protected addValue(key: string, props: ValueProps) {
    const val = new Value(this, props);
    this.values[key] = val;
    this.ctx.didAddValue && this.ctx.didAddValue(key, val);
  }

  protected lookupValue(key: string): Value | undefined {
    const f = (s: Scope) => s.values[key] || (s.parent && f(s.parent));
    const ret = f(this);
    ret && this.cache.set(key, ret);
    return ret;
  }
}

// =============================================================================
// Global
// =============================================================================

export class Global extends Scope {
  root: Scope;

  constructor(ctx: Context, props: ScopeProps) {
    super(ctx, null, {});
    this.root = new Scope(ctx, this, props);
  }
}

// =============================================================================
// Value
// =============================================================================

export type ValueExp = () => any;
export type ValueDep = () => Value;
export type ValueCB = (s: Scope, v: any) => any;

export interface ValueProps {
  exp: () => any;
  deps?: ValueDep[];
}

class Value {
  scope: Scope;
  props: ValueProps;
  exp?: ValueExp;
  cb?: ValueCB;
  src: Set<Value>;
  dst: Set<Value>;
  cycle: number;
  curr: any;

  constructor(scope: Scope, props: ValueProps) {
    this.scope = scope;
    this.props = props;
    this.exp = props.exp;
    this.src = new Set();
    this.dst = new Set();
    this.cycle = 0;
  }

  get() {
    if (this.cycle !== this.scope.ctx.cycle && this.exp) {
      return this.update();
    }
    return this.curr;
  }

  set(val: any) {
    const old = this.curr;
    delete this.exp;
    if (old == null ? val != null : val !== old) {
      this.curr = this.cb ? this.cb(this.scope, val) : val;
      this.propagate();
    }
    return true;
  }

  protected update() {
    this.cycle = this.scope.ctx.cycle;
    const old = this.curr;
    try {
      this.curr = this.exp!.apply(this.scope.obj);
    } catch (err) {
      console.error(err);
    }
    if (old == null ? this.curr != null : this.curr !== old) {
      this.curr = this.cb ? this.cb(this.scope, this.curr) : this.curr;
      this.dst.size && this.scope.ctx.refreshLevel < 1 && this.propagate();
    }
    return this.curr;
  }

  protected propagate() {
    const ctx = this.scope.ctx;
    if (ctx.pushLevel < 1) {
      ctx.cycle++;
    }
    ctx.pushLevel++;
    try {
      this.dst.forEach((v) => v.get());
    } catch (ignored) {}
    ctx.pushLevel--;
  }
}
