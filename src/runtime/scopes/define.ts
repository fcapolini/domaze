import { TemplateElement } from "../../html/dom";
import { Scope, ScopeProps } from "../scope";
import { BaseFactory } from "./base";

export interface DefineProps extends ScopeProps {
  __defines: string;
}

export interface Define extends Scope {
  __extends?: Define | string;
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
    this.ctx.defines.set(props.__defines, scope);
    // console.log('DefineFactory', 'defines:', props.__defines, 'extends:', ext);//tempdebug

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
  }
}
