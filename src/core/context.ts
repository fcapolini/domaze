import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { BaseFactory } from "./scopes/base";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
}

export class Context {
  protos: Map<string, Define>;
  scopeFactory: ScopeFactory;
  global: Scope;
  root: Scope;

  constructor(props: ContextProps) {
    this.protos = new Map();
    this.scopeFactory = this.newScopeFactory();
    this.global = this.newGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.scopeFactory.create(props.root, this.global);
    this.refresh();
  }

  newScopeFactory(): ScopeFactory {
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

  newGlobal(): Scope {
    return this.scopeFactory.create({
      console: { e: () => console },
    });
  }

  newValue(scope: Scope, _key: string, props: ValueProps): Value {
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
