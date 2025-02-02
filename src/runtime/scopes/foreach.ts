import { OUT_OBJ_ID_ATTR } from '../../compiler/const';
import * as dom from '../../html/dom';
import { Scope, ScopeProps } from "../scope";
import { ValueProps } from "../value";
import { BaseFactory } from "./base";

export interface ForeachProps extends ScopeProps {
  __type: 'foreach';
  //TODO key: ValueProps;
  data: ValueProps;
}

export interface Foreach extends Scope {
  __content?: Scope;
  __clones: Scope[];
  __addClone(data: any): void;
  __updateClone(clone: Scope, data: any): void;
  __removeClone(i: number): void;
}

export class ForeachFactory extends BaseFactory {

  override create(props: ScopeProps, parentSelf?: Scope, before?: Scope): Scope {
    const ret = super.create(props, parentSelf, before);
    this.augment(ret);
    return ret;
  }

  augment(scope: Scope) {
    const self = scope.__target as Foreach;
    self.__children.length && (self.__content = self.__children[0]);
    self.__clones = [];

    const makeClone = (data: any) => {
      const props = { ...self.__content!.__props };
      props['data'] = { e: function() { return data; } };
      delete props.__name;
      const clone = self.__ctx.newScope(props, self.__parent!, scope);
      return clone;
    }

    (() => {
      const e = (self.__view as dom.TemplateElement).content?.firstElementChild;
      const id = e?.getAttribute(OUT_OBJ_ID_ATTR) ?? '-';
      const len = id.length + 1;
      self.__view.parentElement?.childNodes.forEach(n => {
        if (n.nodeType !== dom.NodeType.ELEMENT) {
          return;
        }
        const e = n as dom.Element;
        const s = e.getAttribute(OUT_OBJ_ID_ATTR);
        if (s?.startsWith(id)) {
          const index = parseInt(s.substring(len));
          e.setAttribute(OUT_OBJ_ID_ATTR, id);
          const clone = makeClone(null);
          self.__clones[index] = clone;
          e.setAttribute(OUT_OBJ_ID_ATTR, s);
        }
      });
    })();

    const superDispose = self.__dispose;
    self.__dispose = function() {
      self.__clones.forEach(clone => clone.__dispose());
      superDispose();
    }

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

    self.__addClone = function(data: any) {
      // clone DOM
      const dom = (self.__view as dom.TemplateElement)
        .content.firstElementChild!.cloneNode(true) as dom.Element;
      self.__view?.parentElement?.insertBefore(dom, self.__view);
      // clone Scope
      const clone = makeClone(data);
      self.__clones.push(clone);
      // patch DOM's id
      const id = self.__content!.__props.__id;
      const index = self.__clones.length - 1;
      dom.setAttribute(OUT_OBJ_ID_ATTR, `${id}:${index}`);
      // refresh clone
      self.__ctx.refresh(clone, false);
    }

    self.__updateClone = function(clone: Scope, data: any) {
      // @ts-ignore
      clone['data'] = data;
    }

    self.__removeClone = function(i: number) {
      const clone = self.__clones.splice(i, 1)[0];
      clone.__dispose();
    }

    // @ts-ignore
    self['data']?.setCB((scope: Foreach, data: any[]) => {
      if (!self.__content) {
        return data;
      }
      if (!data || !Array.isArray(data)) {
        data = [];
      }
      const offset = 0;
      const length = data.length;
      // add/update clones
      let ci = 0;
      let di = offset;
      for (; di < offset + length; ci++, di++) {
        if (ci < self.__clones.length) {
          scope.__updateClone(self.__clones[ci], data[di]);
        } else {
          scope.__addClone(data[di]);
        }
      }
      // remove excess clones
      while (scope.__clones.length > length) {
        scope.__removeClone(scope.__clones.length - 1);
      }
      return data;
    })
  }
}
