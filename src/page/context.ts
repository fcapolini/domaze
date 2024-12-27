import * as core from "../core/all";
import { Document, Element, NodeType } from "../html/dom";
import { ATTR_VALUE_PREFIX, Scope, ScopeProps } from "./scope";

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

  override newScope(
    props: ScopeProps,
    parent: core.Scope,
    before?: core.Scope
  ) {
    const ret = super.newScope(props, parent, before);
    (ret.__target as Scope).__dom = this.elements.get(props.__id)!;
    return ret;
  }

  override newValue(scope: Scope, key: string, props: core.ValueProps) {
    const ret = new core.Value(scope, props);
    if (key.startsWith(ATTR_VALUE_PREFIX)) {
      const k = key.substring(ATTR_VALUE_PREFIX.length);
      ret.setCB((_, v) => {
        if (v) {
          (scope.__dom as Element).setAttribute(k, `${v}`);
        } else {
          (scope.__dom as Element).removeAttribute(k);
        }
        return v;
      });
    }
    return ret;
  }

  protected override init() {
    super.init();
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
    return this.scopeFactory.create({
      console: { e: () => console },
      document: { e: () => this.doc },
    });
  }
}
