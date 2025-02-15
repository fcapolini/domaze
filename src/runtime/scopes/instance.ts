import { DocumentFragment, Element, TemplateElement } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";
import { DefineProps } from "./define";

export interface InstanceProps extends ScopeProps {
  __uses: string;
}

export interface Instance extends Scope {
}

export class InstanceFactory extends BaseFactory {

  override create(props: ScopeProps, parentSelf?: Scope, before?: Scope): Scope {
    const ret = super.create(props, parentSelf, before);
    this.augment(ret);
    return ret;
  }

  augment(scope: Scope) {
    const props = scope.__props as InstanceProps;
    const define = this.ctx.defines.get(props.__uses);
    define?.__instantiate(scope);
  }
}
