import { Scope, ScopeProps } from "./scope";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
}

export class Context {
  global: Scope;
  root: Scope;

  constructor(props: ContextProps) {
    this.global = new Proxy(this.globalFactory(), {
      get: (scope: Scope, key: string) => scope.__get(key),
      set: (_scope: Scope, _key: string, _val: any) => false,
    });
    this.root = this.load(this.global, props.root);
    this.refresh();
  }

  load(parent: Scope, props: ScopeProps, before?: Scope): any {
    const ret = new Proxy(this.scopeFactory(props), {
      get: (scope: Scope, key: string) => scope.__get(key),
      set: (scope: Scope, key: string, val: any) => scope.__set(key, val),
    }).__link(parent, before);
    props.__children?.forEach(props => this.load(ret, props));
    return ret;
  }

  globalFactory(): Scope {
    return new Scope(this, {
      console: { e: () => console },
    });
  }

  scopeFactory(props: ScopeProps): Scope {
    return new Scope(this, props);
  }

  valueFactory(scope: Scope, props: ValueProps): Value {
    return new Value(scope, props);
  }

  // ===========================================================================
  // reactivity
  // ===========================================================================
  cycle = 0;
  refreshLevel = 0;
  pushLevel = 0;

  refresh(scope?: Scope, nextCycle = true) {
    scope || (scope = this.root);
    this.refreshLevel++;
    try {
      nextCycle && this.cycle++;
      scope.__unlinkValues();
      scope.__linkValues();
      scope.__updateValues();
    } catch (err) {
      console.error('Context.refresh()', err);
    }
    this.refreshLevel--;
  }
}
