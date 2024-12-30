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
  protos: Map<string, Define>;
  global: Scope;
  root: Scope;
  protected baseFactory!: BaseFactory;
  protected defineFactory!: DefineFactory;
  protected foreachFactory!: ForeachFactory;

  constructor(props: ContextProps) {
    this.props = props;
    this.protos = new Map();
    this.init();
    this.global = this.newGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.newScope(props.root, this.global);
    this.refresh();
  }

  newScope(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
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
