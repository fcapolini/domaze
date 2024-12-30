import * as core from "../../core/all";
import { Node } from "../../html/dom";
import { Context } from "../context";

export interface DefineProps extends core.DefineProps {
  __id: string;
}

export interface Define extends core.Define {
  __dom: Node;
}

export class DefineFactory extends core.DefineFactory {
  protected addValues(
    self: core.Define,
    proxy: core.Define,
    props: { [key: string]: core.ValueProps }
  ) {
    const id = (self.__props as DefineProps).__id;
    const dom = (this.ctx as Context).elements.get(id)!;
    (self as Define).__dom = dom;
    super.addValues(self, proxy, props);
  }
}
