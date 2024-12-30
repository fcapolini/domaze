import * as core from "../core/all";
import { Document, Element, NodeType } from "../html/dom";
import { ATTR_VALUE_PREFIX, CLASS_VALUE_PREFIX, Scope, ScopeProps, STYLE_VALUE_PREFIX } from "./scope";
import { BaseFactory } from "./scopes/base";
import { DefineFactory } from "./scopes/define";

export const SCOPE_ID_ATTR = 'data-domaze';

export interface ContextProps extends core.ContextProps {
  doc: Document;
  root: ScopeProps;
}

export class Context extends core.Context {
  doc!: Document;
  elements!: Map<string, Element>;

  constructor(props: ContextProps) {
    super(props);
  }

  override newValue(scope: Scope, key: string, props: core.ValueProps) {
    const ret = super.newValue(scope, key, props);
    const lkey = key.toLowerCase();
    if (lkey === ATTR_VALUE_PREFIX + 'class') {
      ret.setCB((_, v) => {
        (scope.__dom as Element).className = `${v}`;
        return v;
      });
    } else if (lkey === ATTR_VALUE_PREFIX + 'style') {
      ret.setCB((_, v) => {
        (scope.__dom as Element).style.cssText = `${v}`;
        return v;
      });
    } else if (lkey.startsWith(ATTR_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(ATTR_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        v ? (scope.__dom as Element).setAttribute(k, `${v}`)
          : (scope.__dom as Element).removeAttribute(k);
        return v;
      });
    } else if (lkey.startsWith(CLASS_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(CLASS_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        v ? (scope.__dom as Element).classList.add(k)
          : (scope.__dom as Element).classList.remove(k);
        return v;
      });
    } else if (lkey.startsWith(STYLE_VALUE_PREFIX)) {
      const k = camelToDash(key.substring(STYLE_VALUE_PREFIX.length));
      ret.setCB((_, v) => {
        (scope.__dom as Element).style.setProperty(k, v);
        return v;
      });
    }
    return ret;
  }

  protected makeFactories(): core.ScopeFactories {
    const baseFactory = new BaseFactory(this);
    return {
      base: baseFactory,
      define: new DefineFactory(this),
      slot: baseFactory,
      //TODO
      foreach: baseFactory,
    }
  }

  protected override init() {
    this.doc = (this.props as ContextProps).doc;
    this.elements = new Map();
    const lookup = (e: Element) => {
      const id = e.getAttribute(SCOPE_ID_ATTR);
      id && this.elements.set(id, e);
      e.childNodes.forEach(n => {
        n.nodeType === NodeType.ELEMENT && lookup(n as Element);
      });
    }
    lookup(this.doc.documentElement!);
  }

  protected override newGlobal(): core.Scope {
    return this.newScope({
      console: { e: () => console },
      document: { e: () => this.doc },
    });
  }
}

function camelToDash(s: string): string {
  return s.replace(/([a-z][A-Z])/g, (s) => s[0] + '-' + s[1].toLowerCase());
}
