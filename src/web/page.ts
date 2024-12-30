import { Context, ContextProps, ScopeFactories } from "../core/context";
import { Scope } from "../core/scope";
import { BaseFactory, ScopeFactoryDelegate } from "../core/scopes/base";
import { DefineFactory } from "../core/scopes/define";
import { ForeachFactory } from '../core/scopes/foreach';
import { Value, ValueProps } from "../core/value";
import { Document, Element, NodeType } from '../html/dom';

export const SCOPE_ID_ATTR = 'data-domaze';
export const ATTR_VALUE_PREFIX = 'attr_';
export const CLASS_VALUE_PREFIX = 'class_';
export const STYLE_VALUE_PREFIX = 'style_';

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
    const lkey = key.toLowerCase();
    if (lkey === ATTR_VALUE_PREFIX + 'class') {
      ret.setCB((_, v) => {
        (scope.__view as Element).className = `${v}`;
        return v;
      });
    } else if (lkey === ATTR_VALUE_PREFIX + 'style') {
      ret.setCB((_, v) => {
        (scope.__view as Element).style.cssText = `${v}`;
        return v;
      });
    } else if (lkey.startsWith(ATTR_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(ATTR_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        v ? (scope.__view as Element).setAttribute(k, `${v}`)
          : (scope.__view as Element).removeAttribute(k);
        return v;
      });
    } else if (lkey.startsWith(CLASS_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(CLASS_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        v ? (scope.__view as Element).classList.add(k)
          : (scope.__view as Element).classList.remove(k);
        return v;
      });
    } else if (lkey.startsWith(STYLE_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(STYLE_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        (scope.__view as Element).style.setProperty(k, v);
        return v;
      });
    }
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

  protected getView(id: string, from?: Element) {
    const lookup = (e: Element): Element | null => {
      if (e.getAttribute(SCOPE_ID_ATTR) === id) {
        return e;
      }
      let res: Element | null;
      for (const child of e.childNodes) {
        if (child.nodeType === NodeType.ELEMENT) {
          if ((res = lookup(child as Element)) !== null) {
            return res;
          }
        }
      }
      return null;
    }
    return lookup(from ?? this.doc.documentElement!);
  }

  // ===========================================================================
  // as ScopeFactoryDelegate
  // ===========================================================================

  didInit(self: Scope, proxy: Scope) {
    const id = self.__props.__id;
    const view = id ? this.getView(id, self.__parent?.__view) : null;
    view && (self.__view = view);
  }
}

function camelToDash(s: string): string {
  return s.replace(/([a-z][A-Z])/g, (s) => s[0] + '-' + s[1].toLowerCase());
}
