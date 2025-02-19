import { Element, TemplateElement } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";
import { Instance } from "./instance";

export interface DefineProps extends ScopeProps {
  __defines: string;
}

export interface Define extends Scope {
  __extends?: Define | string;
  __instantiate(instance: Instance): void;
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

    //
    // add Define methods
    //

    self.__instantiate = function(instance: Instance) {
      const e = model.cloneNode(true) as Element;
      const old = instance.__view;
      const p = old.parentElement!;
      p.insertBefore(e, old);
      p.removeChild(old);
      instance.__view = e;
      // 0. DOM attributes
      old.getAttributeNames().forEach(key => {
        e.setAttribute(key, old.getAttribute(key) ?? '');
      });
      // 1. values
      const props = (self as any).__children[0].__props;
      instance.__add(props);//TODO: shouldn't override namesake instance values
      //TODO: possible conflict in value text naming (model vs instance texts)
      //TODO
      // 3. populate from instance contents
      //TODO
    }
  }
}
