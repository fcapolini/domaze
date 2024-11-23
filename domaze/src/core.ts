export enum SCOPE {
  VALUE_FN = '$value',
  PARENT = '$parent', //TODO
  CLONER = '$cloner',
}

export enum FOREACH {
  AS = 'as',
  DEF_DATA = 'data',
  CLONE_NR = '$cloneNr',
}

export type ScopeType = 'foreach' | 'component';

// =============================================================================
// Context
// =============================================================================

export interface ContextProps {
  globalFactory?: (ctx: Context, props: ScopeProps) => Global;
  scopeFactory?: (
    ctx: Context,
    props: ScopeProps,
    parent?: Scope,
    before?: Scope
  ) => Scope;
  valueFactory?: (key: string, scope: Scope, props: ValueProps) => Value;
}

export class Context {
  props?: ContextProps;
  scopeFactory: (
    ctx: Context,
    props: ScopeProps,
    parent?: Scope,
    before?: Scope
  ) => Scope;
  valueFactory: (key: string, scope: Scope, props: ValueProps) => Value;
  global: Global;
  root: Scope;
  cycle = 0;
  refreshLevel = 0;
  pushLevel = 0;

  constructor(props: ScopeProps, contextProps?: ContextProps) {
    this.props = contextProps;
    this.scopeFactory = contextProps?.scopeFactory ?? Context.defScopeFactory;
    this.valueFactory = contextProps?.valueFactory ?? Context.defValueFactory;
    this.global = contextProps?.globalFactory
      ? contextProps.globalFactory(this, props)
      : new Global(this, props);
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
      console.error('Context.refresh()', err);
    }
    this.refreshLevel--;
  }

  static defScopeFactory(
    ctx: Context,
    props: ScopeProps,
    parent?: Scope,
    before?: Scope
  ) {
    if (props.type === 'foreach') {
      return new Foreach(ctx, props as ForeachProps, parent, before);
    } else if (props.type === 'component') {
      return new Component(ctx, props, parent);
    }
    return new Scope(ctx, props, parent, before);
  }

  static defValueFactory(_key: string, scope: Scope, props: ValueProps) {
    return new Value(scope, props);
  }
}

// =============================================================================
// Scope
// =============================================================================

export interface ScopeProps {
  id?: string;
  name?: string;
  type?: ScopeType;
  values?: { [key: string]: ValueProps };
  children?: ScopeProps[];
}

export class Scope {
  ctx: Context;
  props: ScopeProps;
  values: { [key: string]: Value };
  parent?: Scope;
  children: Scope[];
  cache: Map<string, Value>;
  obj: any;

  constructor(ctx: Context, props: ScopeProps, parent?: Scope, before?: Scope) {
    this.ctx = ctx;
    this.props = props;

    this.values = {};
    props.values &&
      Reflect.ownKeys(props.values).forEach((key) => {
        if (typeof key === 'string') {
          this.addValue(key, props.values![key]);
        }
      });
    this.addValue(SCOPE.VALUE_FN, {
      exp: () => (key: string) => this.values[key],
    });

    this.children = [];
    props.children?.forEach((props) => ctx.scopeFactory(ctx, props, this));

    this.cache = new Map();
    this.obj = new Proxy(this.values, {
      get: (_, key: string | symbol) => {
        if (typeof key === 'symbol') {
          return undefined;
        }
        const v = this.cache.get(key) || this.lookupValue(key);
        return v?.get();
      },

      set: (_, key: string | symbol, val: any) => {
        if (typeof key === 'symbol' || !this.parent /* is global scope */) {
          return false;
        }
        const v = this.cache.get(key) || this.lookupValue(key);
        return v?.set(val) ?? false;
      },

      defineProperty: () => false,

      deleteProperty: () => false,
    });

    if ((this.parent = parent)) {
      const i = before ? parent.children.indexOf(before) : -1;
      parent.children.splice(i < 0 ? parent.children.length : i, 0, this);
      props.name && parent.addValue(props.name, { exp: () => this.obj });
    }
  }

  dispose() {
    const i = this.parent ? this.parent.children.indexOf(this) : -1;
    i < 0 || this.parent!.children.splice(i, 1);
    this.unlinkValues();
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
        } catch (ignored) {}
      });
    });
    recur && this.children.forEach((s) => s.linkValues());
  }

  updateValues(recur = true) {
    this.foreachValue((v) => v.get());
    recur && this.children.forEach((s) => s.updateValues());
  }

  protected addValue(key: string, props: ValueProps): this {
    const val = this.ctx.valueFactory(key, this, props);
    this.values[key] = val;
    return this;
  }

  protected foreachValue(cb: (v: Value) => void) {
    const values = this.values;
    (Reflect.ownKeys(values) as string[]).forEach((k) => cb(values[k]));
  }

  protected lookupValue(key: string): Value | undefined {
    const f = (s: Scope) => s.values[key] || (s.parent && f(s.parent));
    const ret = f(this);
    ret && this.cache.set(key, ret);
    return ret;
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

export class Value {
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

  setCB(cb: ValueCB): this {
    this.cb = cb;
    return this;
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

// =============================================================================
// Global
// =============================================================================

export class Global extends Scope {
  root: Scope;

  constructor(ctx: Context, props: ScopeProps, globalProps: ScopeProps = {}) {
    super(ctx, globalProps);
    this.root = ctx.scopeFactory(ctx, props, this);
  }
}

// =============================================================================
// Foreach
// =============================================================================

export interface ForeachProps extends ScopeProps {
  type: 'foreach';
}

export class Foreach extends Scope {
  dataValueName: string;
  content?: Scope;
  clones: Scope[];

  constructor(
    ctx: Context,
    props: ForeachProps,
    parent?: Scope,
    before?: Scope
  ) {
    super(ctx, props, parent, before);
    try {
      this.dataValueName = props.values![FOREACH.AS].exp().trim();
    } catch (ignored) {}
    this.dataValueName || (this.dataValueName = FOREACH.DEF_DATA);
    this.content = this.children.length ? this.children[0] : undefined;
    this.clones = [];
    this.values[FOREACH.DEF_DATA]?.setCB(Foreach.dataCB as ValueCB);
  }

  override dispose() {
    this.clones.forEach((it) => it.dispose());
    super.dispose();
  }

  override unlinkValues(recur = true) {
    super.unlinkValues(false);
  }

  override linkValues(recur = true) {
    super.linkValues(false);
  }

  override updateValues(recur = true) {
    super.updateValues(false);
  }

  static dataCB(self: Foreach, data: any[]) {
    if (!self.content) {
      return data;
    }
    if (!data || !Array.isArray(data)) {
      data = [];
    }
    const offset = 0;
    const length = data.length;

    // add/update clones
    let ci = 0;
    let di = offset;
    for (; di < offset + length; ci++, di++) {
      if (ci < self.clones.length) {
        self.updateClone(self.clones[ci], data[di]);
      } else {
        self.addClone(data[di]);
      }
    }

    // remove excess clones
    while (self.clones.length > length) {
      self.removeClone(self.clones.length - 1);
    }

    return data;
  }

  addClone(data: any) {
    const that = this;
    const props = { ...this.content!.props };
    props.values || (props.values = {});
    props.values[FOREACH.DEF_DATA] = { exp: () => data };
    props.values[FOREACH.CLONE_NR] = { exp: () => that.clones.indexOf(clone) };
    props.values[SCOPE.CLONER] = { exp: () => that.obj };
    delete props.name;
    const clone = this.ctx.scopeFactory(
      this.ctx,
      props,
      this.parent,
      this
    ) as Foreach;
    this.clones.push(clone);
    this.ctx.refresh(clone, false);
  }

  updateClone(clone: Scope, data: any) {
    clone.obj[FOREACH.DEF_DATA] = data; //TODO
  }

  removeClone(i: number) {
    const clone = this.clones.splice(i, 1)[0];
    clone.dispose();
  }
}

// =============================================================================
// Component
// =============================================================================

export class Component extends Scope {
  constructor(ctx: Context, props: ScopeProps, parent?: Scope) {
    super(ctx, props, parent);
  }
}
