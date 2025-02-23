import { Document, Element, Node, NodeType, TemplateElement } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";
import { Instance } from "./instance";

export interface DefineProps extends ScopeProps {
  __defines: string;
}

export interface Define extends Scope {
  __extends?: Define | string;
  // __instantiate(instance: Instance): void;
}

export class DefineFactory extends BaseFactory {

  override create(props: ScopeProps, parentSelf?: Scope, before?: Scope): Scope {
    const ret = super.create(props, parentSelf, before);
    this.augment(ret);
    return ret;
  }

  augment(scope: Scope) {
    const self = scope.__target as Define;
    const template = self.__view as TemplateElement;
    const model = template.content.firstElementChild!;
    const props = scope.__props as DefineProps;
    const ext = model.tagName.toLocaleLowerCase();
    self.__extends = ext.includes('-') ? this.ctx.defines.get(ext) : ext;
    this.ctx.defines.set(props.__defines, self);

    //
    // hide child from reactivity: it's just a model for clones
    //

    const superUnlinkValues = self.__unlinkValues;
    self.__unlinkValues = function(recur = true) {
      superUnlinkValues(false);
    }

    const superLinkValues = self.__linkValues;
    self.__linkValues = function(recur = true) {
      superLinkValues(false);
    }

    const superUpdateValues = self.__updateValues;
    self.__updateValues = function(recur = true) {
      superUpdateValues(false);
    }

    // //
    // // add Define methods
    // //

    // self.__instantiate = function(instance: Instance) {
    //   const e = model.cloneNode(true) as Element;
    //   const old = instance.__view;
    //   if (!old.tagName.includes('-')) {
    //     // we're reloading an already instantiated scope
    //     return;
    //   }
    //   const doc = old.ownerDocument!;
    //   const p = old.parentElement!;
    //   p.insertBefore(e, old);
    //   p.removeChild(old);
    //   instance.__view = e;
    //   // transfer model's DOM attributes
    //   old.getAttributeNames().forEach(key => {
    //     e.setAttribute(key, old.getAttribute(key) ?? '');
    //   });
    //   // populate instance DOM
    //   const { slotMap, slotList } = DefineFactory.collectSlots(e, doc);
    //   DefineFactory.populateInstance(old, e, slotMap);
    //   slotList.forEach(slot => slot.parentElement!.removeChild(slot));
    //   // transfer model's values
    //   // const modelProps = (self as any).__children[0].__props;
    //   // const instanceProps = instance.__props;
    //   // const props = {
    //   //   ...modelProps,
    //   //   ...instanceProps
    //   // };
    //   // instance.__add(props);
    // }
  }

  static cloneDOM(self: Define): Element {
    const template = self.__view as TemplateElement;
    const content = template.content.firstElementChild!;
    const clonedDOM = content.cloneNode(true) as Element;
    return clonedDOM;
  }

  static collectSlots(e: Element, doc: Document) {
    const slotMap = new Map<string, Element>();
    const slotList = new Array<Element>();
    //TODO: use getElementsByTagName()
    const f = (p: Element) => {
      for (const n of p.childNodes) {
        if (n.nodeType !== NodeType.ELEMENT) {
          continue;
        }
        if ((n as Element).tagName === 'SLOT') {
          const slot = n as Element;
          const name = slot.getAttribute('name');
          name && slotMap.set(name, slot);
          slotList.push(slot);
          continue;
        }
        f(n as Element);
      }
    };
    f(e);
    if (!slotMap.has('default')) {
      const slot = doc.createElement('slot')!;
      e.appendChild(slot);
      slotMap.set('default', slot);
      slotList.push(slot);
    }
    return { slotMap, slotList };
  }

  static populateInstance(old: Element, e: Element, slotMap: Map<string, Element>) {
    [...old.childNodes].forEach(n => {
      old.removeChild(n);
      e.appendChild(n);
      //TODO: link following slots
    });
  }
}
