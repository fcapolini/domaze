import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { BaseFactory } from "./scopes/base";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
  // scopeFactory?: ScopeFactory;
}

export class Context {
  props: ContextProps;
  // protected scopeFactory: ScopeFactory;
  protos: Map<string, Define>;
  global: Scope;
  root: Scope;
  protected baseFactory!: BaseFactory;
  protected defineFactory!: DefineFactory;
  protected foreachFactory!: ForeachFactory;

  constructor(props: ContextProps) {
    this.props = props;
    // this.scopeFactory = props.scopeFactory ?? new CoreScopeFactory(this);
    this.protos = new Map();
    this.init();
    this.global = this.newGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.newScope(props.root, this.global);
    this.refresh();
  }

  newScope(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
    // return this.scopeFactory.create(props, parent, before);
    switch (props.__type) {
      case 'define':
        return this.defineFactory.create(props, parent, before);
      case 'foreach':
        return this.foreachFactory.create(props, parent, before);
      default:
        return this.baseFactory.create(props, parent, before);
    }
  }

  newValue(scope: Scope, _key: string, props: ValueProps): Value {
    return new Value(scope, props);
  }

  // ===========================================================================
  // private
  // ===========================================================================

  protected init() {
    this.baseFactory ??= new BaseFactory(this);
    this.defineFactory ??= new DefineFactory(this);
    this.foreachFactory ??= new ForeachFactory(this);
  }

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

export class CoreScopeFactory implements ScopeFactory {
  base: ScopeFactory;
  map: Map<string, ScopeFactory>;

  constructor(ctx: Context) {
    this.map = new Map();
    this.base = new BaseFactory(ctx);
    this.map.set('define', new DefineFactory(ctx));
    this.map.set('foreach', new ForeachFactory(ctx));
  }

  create(props: ScopeProps, parent: Scope, before?: Scope) {
    return ((props.__type && this.map.get(props.__type)) ?? this.base)
      .create(props, parent, before);
  }
}
