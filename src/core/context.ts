import { ScopeFactory, Scope, ScopeProps } from "./scope";
import { Define, makeDefine } from "./scopes/define";
import { makeForeach } from "./scopes/foreach";
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
    this.scopeFactory = this.createScopeFactory();
    this.global = this.makeGlobal();
    // write-protect global object
    this.global.__handler.set = () => false;
    this.root = this.load(this.global, props.root);
    this.refresh();
  }

  load(parent: Scope, props: ScopeProps, before?: Scope): any {
    const ret = this.scopeFactory.make(props);
    if (props.__type === 'define') {
      makeDefine(ret);
      props.__name && this.protos.set(props.__name, ret as Define);
    } else {
      ret.__link(parent, before);
      props.__children?.forEach(props => this.load(ret, props));
    }
    if (props.__type === 'foreach') {
      makeForeach(ret);
    }
    return ret;
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
    return new ScopeFactory(this);
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
