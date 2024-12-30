import { Context, ContextProps, ScopeFactories } from "../core/context";
import { Scope } from "../core/scope";
import { BaseFactory, ScopeFactoryDelegate } from "../core/scopes/base";
import { DefineFactory } from "../core/scopes/define";
import { ForeachFactory } from '../core/scopes/foreach';
import { Value, ValueProps } from "../core/value";
import { Document } from '../html/dom';

export const SCOPE_ID_ATTR = 'data-domaze';

export interface PageProps extends ContextProps {
  doc: Document;
}

export class Page extends Context implements ScopeFactoryDelegate {
  doc!: Document;

  constructor(props: PageProps) {
    super(props);
  }

  override newValue(scope: Scope, key: string, props: ValueProps): Value {
    const ret = super.newValue(scope, key, props);
    //TODO: set callbacks
    return ret;
  }

  protected override makeFactories(): ScopeFactories {
    const baseFactory = new BaseFactory(this, this);
    return {
      base: baseFactory,
      slot: baseFactory,
      define: new DefineFactory(this, this),
      foreach: new ForeachFactory(this, this),
    }
  }

  protected override init() {
    this.doc = (this.props as PageProps).doc;
  }

  // ===========================================================================
  // as ScopeFactoryDelegate
  // ===========================================================================

  didInit(self: Scope, proxy: Scope) {
    //TODO
    if (!self.__props.__id) {
      return;
    }
    console.log('scope didInit', self.__props.__id, self.__props.__type, self.__parent?.__props.__id);//tempdebug
  }
}