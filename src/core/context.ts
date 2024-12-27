import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { BaseFactory } from "./scopes/base";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
}

export class Context {
  props: ContextProps;
  protos!: Map<string, Define>;
  protected scopeFactory!: ScopeFactory;
  global!: Scope;
  root: Scope;

  constructor(props: ContextProps) {
    this.props = props;
    this.init();
    this.global = this.newGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.newScope(props.root, this.global);
    this.refresh();
  }

  newScope(props: ScopeProps, parent: Scope, before?: Scope) {
    return this.scopeFactory.create(props, parent, before);
  }

  newValue(scope: Scope, _key: string, props: ValueProps): Value {
    return new Value(scope, props);
  }

  // ===========================================================================
  // private
  // ===========================================================================

  protected init() {
    this.protos = new Map();
    this.scopeFactory = this.newScopeFactory();
  }

  protected newGlobal(): Scope {
    return this.scopeFactory.create({
      console: { e: () => console },
    });
  }

  protected newScopeFactory(): ScopeFactory {
    return new class implements ScopeFactory {
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
    }(this);
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
