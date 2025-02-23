import { DocumentFragment, Element, TemplateElement } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";
import { Define, DefineFactory, DefineProps } from "./define";

export interface InstanceProps extends ScopeProps {
  __uses: string;
}

export interface Instance extends Scope {
}

export class InstanceFactory extends BaseFactory {
  override create(
    props: InstanceProps,
    parentSelf?: Scope,
    before?: Scope
  ): Scope {
    console.log("InstanceFactory.create()", props.__uses);
    const define = this.ctx.defines.get(props.__uses) ?? null;
    const model = define?.__children[0]?.__target ?? null;
    const self = Object.create(null) as Scope;
    if (model) {
      props = this.inherit(self, define!, model, props, parentSelf);
    }
    const proxy = this.init(self, props, parentSelf, before);
    return proxy;
  }

  protected inherit(
    self: Scope,
    define: Define,
    model: Scope,
    props: InstanceProps,
    parentSelf?: Scope
  ): InstanceProps {
    const ret = {
      ...model.__props,
      ...props,
    };
    const oldDOM = this.lookupView(props, parentSelf?.__view)!;
    if (oldDOM.tagName.toLowerCase() !== props.__uses) {
      // we're reloading an already instantiated definition
      return ret;
    }
    const newDOM = DefineFactory.cloneDOM(define);
    const p = oldDOM.parentElement!;
    p.insertBefore(newDOM, oldDOM);
    p.removeChild(oldDOM);
    self.__view = newDOM;

    // DOM attributes
    oldDOM.getAttributeNames().forEach(key => {
      newDOM.setAttribute(key, oldDOM.getAttribute(key) ?? '');
    });

    // instance DOM
    [...oldDOM.childNodes].forEach(n => {
      oldDOM.removeChild(n);
      //TODO: slots
      newDOM.appendChild(n);
    });

    return ret;
  }
}
