import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { BaseFactory } from "./scopes/base";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
}

export interface ScopeFactories {
  base: ScopeFactory;
  define: ScopeFactory;
  slot: ScopeFactory;
  foreach: ScopeFactory;
}

export class Context {
  props: ContextProps;
  protos: Map<string, Define>;
  global: Scope;
  root: Scope;
  protected baseFactory!: BaseFactory;
  protected defineFactory!: DefineFactory;
  protected foreachFactory!: ForeachFactory;
  factories: ScopeFactories;

  constructor(props: ContextProps) {
    this.props = props;
    this.protos = new Map();
    this.factories = this.makeFactories();
    this.init();
    this.global = this.newGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.newScope(props.root, this.global);
    this.refresh();
  }

  newScope(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
    return this.factories[props.__type ?? 'base'].create(props, parent, before);
  }

  newValue(scope: Scope, _key: string, props: ValueProps): Value {
    return new Value(scope, props);
  }

  // ===========================================================================
  // private
  // ===========================================================================

  protected makeFactories(): ScopeFactories {
    const baseFactory = new BaseFactory(this);
    return {
      base: baseFactory,
      slot: baseFactory,
      define: new DefineFactory(this),
      foreach: new ForeachFactory(this),
    }
  }

  protected init() {}

  protected newGlobal(): Scope {
    return this.newScope({
      console: { e: () => console },
    });
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
