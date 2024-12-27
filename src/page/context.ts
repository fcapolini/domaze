import * as core from "../core/all";
import { Document, Element, NodeType } from "../html/dom";

export const SCOPE_ID_ATTR = 'data-domaze';

export interface ContextProps extends core.ContextProps {
  doc: Document;
}

export class Context extends core.Context {
  doc!: Document;
  elements!: Map<string, Element>;

  constructor(props: ContextProps) {
    super(props);
  }

  override newScope(
    props: core.ScopeProps,
    parent: core.Scope,
    before?: core.Scope
  ) {
    const ret = super.newScope(props, parent, before);

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
