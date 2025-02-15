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
    const self = scope.__target as Instance;
    const props = scope.__props as InstanceProps;
    const def = this.ctx.defines.get(props.__uses);
    const defProps = def?.__props as DefineProps;
    const defTemplate = def?.__view as TemplateElement;
    const newView = defTemplate.content.documentElement!.cloneNode(true) as Element;

    const oldView = self.__view;
    const domParent = oldView.parentElement!;

    console.log('' + oldView);
    console.log('' + newView);
    oldView.getAttributeNames().forEach(key => {
      newView.setAttribute(key, oldView.getAttribute(key) ?? '');
    });

    domParent.insertBefore(newView, oldView);
    domParent.removeChild(oldView);
    self.__view = newView;
  }
}
