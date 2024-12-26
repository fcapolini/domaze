import * as core from "../core/all";
import { Document } from "../html/dom";

export interface ContextProps extends core.ContextProps {
  doc: Document;
}

export class Context extends core.Context {
  doc!: Document;

  constructor(props: ContextProps) {
    super(props);
  }

  protected override init() {
    super.init();
    this.doc = (this.props as ContextProps).doc;
  }
}
