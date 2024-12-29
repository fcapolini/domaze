import * as core from "../../core/all";
import { Node } from "../../html/dom";
import { Context } from "../context";

export interface ScopeProps extends core.ScopeProps {
  __id: string;
}

export interface Scope extends core.Scope {
  __dom: Node;
}

export class BaseFactory extends core.BaseFactory {
  protected addValues(
    self: core.Scope,
    proxy: core.Scope,
    props: { [key: string]: core.ValueProps }
  ) {
    const id = (self.__props as ScopeProps).__id;
    const dom = (this.ctx as Context).elements.get(id)!;
    (self as Scope).__dom = dom;
    super.addValues(self, proxy, props);
  }
}
