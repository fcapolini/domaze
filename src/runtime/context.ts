import { GlobalFactory } from "./global";
import { Scope, ScopeFactory, ScopeProps } from "./scope";
import { BaseFactory } from "./scopes/base";
import * as dom from "../html/dom";

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
    this.global = new GlobalFactory(this).create({});
    this.factories = new Map();
    this.factories.set('base', new BaseFactory(this));
    this.root = this.newScope(props.root, this.global);
    this.refresh();
  }

  newScope(props: ScopeProps, parent: Scope) {
    return this.factories.get('base')!.create(props, parent);
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
