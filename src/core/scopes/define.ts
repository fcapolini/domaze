import { Scope, ScopeProps } from "../scope";
import { Value, ValueProps } from "../value";
import { BaseFactory } from "./base";

export interface DefineProps extends ScopeProps {
  __type: 'define';
  __name: string;
}

export interface Define extends Scope {
  __values: { [key: string]: ValueProps };
  __apply(dst: Scope): void;
  // __slots: { [key: string]: Scope };
}

export class DefineFactory extends BaseFactory {

  override create(props: ScopeProps, _parent?: Scope, _before?: Scope): Scope {
    const ret = this.make(props);
    props.__name && this.ctx.protos.set(props.__name, ret as Define);
    return ret;
  }

  protected override addValues(
    self: Define,
    proxy: Define,
    props: { [key: string]: ValueProps }
  ) {
    const functions = {};
    self.__values ??= {};
    // self.__slots ??= {};
    Reflect.ownKeys(props).forEach(key => {
      if (typeof key !== 'string' || key.startsWith('__')) {
        return;
      }
      const v = props[key] as ValueProps;
      if (v.e) {
        self.__values[key] = v;
      } else {
        functions[key] = v;
      }
    });
    proxy.__add(functions);

    self.__apply = function(dest: Scope) {
      const target = dest.__target;
      Object.setPrototypeOf(target, self);
      if (target.__props.__type === 'define') {
        return;
      }
      target.__slots = new Map();
      const ctx = self.__ctx;
      const apply = (self: Define) => {
        const proto = self.__props.__proto;
        const supr = proto && ctx.protos.get(proto)?.__target as Define;
        supr && apply(supr);
        dest.__add(self.__values);
        self.__props.__children?.forEach(props => {
          ctx.scopeFactory.create(props, dest);
        });
      }
      apply(self);
    }
  }

  protected addChildren(
    _self: Scope,
    _proxy: Scope,
    _children?: { [key: string]: ValueProps }[]
  ) {
    // nop
  }
}
