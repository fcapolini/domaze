import * as dom from "../html/dom";
import { GlobalFactory } from "./global";
import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { BaseFactory } from "./scopes/base";
import { ForeachFactory } from "./scopes/foreach";

export interface ContextProps {
  doc: dom.Document;
  root: ScopeProps;
}

export class Context {
  props: ContextProps;
  global: Scope;
  factories: Map<string, ScopeFactory>;
  root: Scope;

  constructor(props: ContextProps) {
    this.props = props;
    this.factories = new Map();
    this.factories.set('base', new BaseFactory(this));
    this.factories.set('foreach', new ForeachFactory(this));
    this.global = new GlobalFactory(this).create(props.root);
    this.root = this.global.__children[0];
    this.refresh();
  }

  newScope(props: ScopeProps, parent: Scope, before?: Scope) {
    const type = props.__type ?? 'base';
    return this.factories.get(type)!.create(props, parent, before);
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
