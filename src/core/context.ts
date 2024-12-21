import { BaseFactory, Scope, ScopeProps } from "./scope";
import { Define, DefineFactory } from "./scopes/define";
import { ForeachFactory } from "./scopes/foreach";
import { Value, ValueProps } from "./value";

export interface ContextProps {
  root: ScopeProps;
}

export class Context {
  protos: Map<string, Define>;
  scopeFactory: BaseFactory;
  foreachFactory: ForeachFactory;
  defineFactory: DefineFactory;
  global: Scope;
  root: Scope;

  constructor(props: ContextProps) {
    this.protos = new Map();
    this.scopeFactory = this.createScopeFactory();
    this.foreachFactory = this.createForeachFactory();
    this.defineFactory = this.createDefineFactory();
    this.global = this.makeGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    // this.root = this.load(this.global, props.root);
    this.root = this.create(props.root, this.global);
    this.refresh();
  }

  create(props: ScopeProps, parent: Scope, before?: Scope): Scope {
    if (props.__type === 'foreach') {
      return this.foreachFactory.create(props, parent, before);
    }
    if (props.__type === 'define') {
      return this.defineFactory.create(props, parent, before);
    }
    return this.scopeFactory.create(props, parent, before);
  }

  makeGlobal(): Scope {
    return this.scopeFactory.make({
      console: { e: () => console },
    });
  }

  valueFactory(scope: Scope, _key: string, props: ValueProps): Value {
    return new Value(scope, props);
  }

  createScopeFactory() {
    return new BaseFactory(this);
  }
  createForeachFactory() {
    return new ForeachFactory(this);
  }
  createDefineFactory() {
    return new DefineFactory(this);
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
