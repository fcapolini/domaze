import { Element, NodeType } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";
import { Define, DefineFactory } from "./define";

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
    const define = this.ctx.defines.get(props.__uses) ?? null;
    const model = define?.__children[0]?.__target ?? null;
    const self = Object.create(null) as Instance;
    if (model) {
      const slotmap = define!.__props.__slotmap ?? {};
      props = this.inherit(self, define!, model, props, slotmap, parentSelf);
    }
    const proxy = this.init(self, props, parentSelf, before);
    return proxy;
  }

  protected inherit(
    self: Instance,
    define: Define,
    model: Scope,
    props: InstanceProps,
    slotmap: { [key: string]: number },
    parentSelf?: Scope,
  ): InstanceProps {
    props.__children?.forEach(child => child.__slot || (child.__slot = 'default'));
    const ret = {
      ...model.__props,
      ...props,
      __slotmap: slotmap,
      __children: [
        ...(model.__props.__children ?? []),
        ...(props.__children ?? [])
      ]
    };
    const oldDOM = this.lookupView(props, parentSelf?.__view)!;
    const doc = oldDOM.ownerDocument!;
    if (oldDOM.tagName.toLowerCase() !== props.__uses) {
      // we're loading an already instantiated definition
      // (this happens routinely in the client)
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
    const { slotMap, slotList } = DefineFactory.collectSlots(newDOM, doc);
    [...oldDOM.childNodes].forEach(n => {
      let slotName = 'default';
      oldDOM.removeChild(n);
      if (n.nodeType === NodeType.ELEMENT) {
        slotName = (n as Element).getAttribute('slot') ?? 'default';
      }
      const slot = slotMap.get(slotName) ?? slotMap.get('default')!;
      slot.parentElement!.insertBefore(n, slot);
    });
    slotList.forEach(slot => slot.parentElement!.removeChild(slot));

    return ret;
  }
}
