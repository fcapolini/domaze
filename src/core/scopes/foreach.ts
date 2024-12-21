import { Context } from "../context";
import { Scope, ScopeFactory, ScopeProps } from "../scope";
import { ValueProps } from "../value";

export interface ForeachProps extends ScopeProps {
  __type: 'foreach';
  data: ValueProps;
  //TODO: key property
}

export interface Foreach extends Scope {
  __content?: Scope;
  __clones: Scope[];
  __addClone(data: any): void;
  __updateClone(clone: Scope, data: any): void;
  __removeClone(i: number): void;
}

export class ForeachFactory extends ScopeFactory {

  create(props: ScopeProps, parent: Scope, before?: Scope): Scope {
    const ret = super.create(props, parent, before);
    this.adapt(ret, props as ForeachProps);
    return ret;
  }

  adapt(scope: Scope, props: ForeachProps): Foreach {
    const self = scope.__target as Foreach;

    self.__children.length && (self.__content = self.__children[0]);
    self.__clones = [];

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
    });

    self.__addClone = function(data: any) {
      const props = { ...self.__content!.__props };
      props['data'] = { e: function() { return data; } };
      delete props.__name;
      const clone = self.__ctx.create(props, self.__parent!, this);
      self.__clones.push(clone);
      self.__ctx.refresh(clone, false);
    }

    self.__updateClone = function(clone: Scope, data: any) {
      clone['data'] = data;
    }

    self.__removeClone = function(i: number) {
      const clone = self.__clones.splice(i, 1)[0];
      clone.__dispose();
    }

    return scope as Foreach;
  }
}
