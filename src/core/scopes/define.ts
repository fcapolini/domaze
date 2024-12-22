import { Scope, ScopeProps } from "../scope";
import { Value, ValueProps } from "../value";
import { BaseFactory } from "./base";

export interface DefineProps extends ScopeProps {
  __type: 'define';
  __name: string;
}

export interface Define extends Scope {
  __values: { [key: string]: ValueProps };
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
    self.__values = {};
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
  }

  protected addChildren(
    _self: Scope,
    _proxy: Scope,
    _children?: { [key: string]: ValueProps }[]
  ) {
    // nop
  }
}
