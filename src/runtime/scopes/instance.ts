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
    console.log('InstanceFactory.create()', props.__uses);
    const model = this.ctx.defines.get(props.__uses)!;
    const self = Object.create(model) as Scope;
    this.inherit(self, model, props, parentSelf);
    const proxy = this.init(self, props, parentSelf, before);
    return proxy;
  }

  protected inherit(self: Scope, from: Scope, props: ScopeProps, parentSelf?: Scope) {
    self.__view = this.lookupView(props, parentSelf?.__view)!;
  }
}
