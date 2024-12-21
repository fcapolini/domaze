import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { BaseFactory } from "./scopes/base";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
  scopeFactory?: ScopeFactory;
}

export class Context {
  protos: Map<string, Define>;
  scopeFactory: ScopeFactory;
  global: Scope;
  root: Scope;

  constructor(props: ContextProps) {
    this.protos = new Map();
    this.scopeFactory = props.scopeFactory
      ? props.scopeFactory
      : new class implements ScopeFactory {
        base: ScopeFactory;
        map: Map<string, ScopeFactory>;

        constructor(ctx: Context) {
          this.map = new Map();
          this.base = new BaseFactory(ctx);
          this.map.set('define', new DefineFactory(ctx));
          this.map.set('foreach', new ForeachFactory(ctx));
        }

        create(props: ScopeProps, parent: Scope, before?: Scope) {
          const factory = (props.__type && this.map.get(props.__type)) ?? this.base;
          return factory.create(props, parent, before);
        }
      }(this);
    this.global = this.makeGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    // this.root = this.load(this.global, props.root);
    this.root = this.create(props.root, this.global);
    this.refresh();
  }

  create(props: ScopeProps, parent: Scope, before?: Scope): Scope {
    // if (props.__type === 'foreach') {
    //   return this.foreachFactory.create(props, parent, before);
    // }
    // if (props.__type === 'define') {
    //   return this.defineFactory.create(props, parent, before);
    // }
    return this.scopeFactory.create(props, parent, before);
  }

  makeGlobal(): Scope {
    return this.scopeFactory.create({
      console: { e: () => console },
    });
  }

  valueFactory(scope: Scope, _key: string, props: ValueProps): Value {
    return new Value(scope, props);
  }

  // createScopeFactory() {
  //   return new BaseFactory(this);
  // }
  // createForeachFactory() {
  //   return new ForeachFactory(this);
  // }
  // createDefineFactory() {
  //   return new DefineFactory(this);
  // }

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

class DefaultScopeFactory implements ScopeFactory {
  base: ScopeFactory;
  map: Map<string, ScopeFactory>;

  constructor(ctx: Context) {
    this.map = new Map();
    this.base = new BaseFactory(ctx);
    this.map.set('define', new DefineFactory(ctx));
    this.map.set('foreach', new ForeachFactory(ctx));
  }

  create(props: ScopeProps, parent: Scope, before?: Scope) {
    const factory = (props.__type && this.map.get(props.__type)) ?? this.base;
    return factory.create(props, parent, before);
  }
}
