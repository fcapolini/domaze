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

  override create(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
    const ret = this.make(props);
    props.__name && this.ctx.protos.set(props.__name, ret as Define);
    return ret;
  }

  override make(props: ScopeProps): Define {
    const scope = super.make(props);
    const self = scope.__target as Define;
    // only keep function values in the prototype object
    self.__values = {};
    [...Reflect.ownKeys(self)].forEach(key => {
      const v = self[key] as Value;
      if (typeof key === 'string' && v instanceof Value && !v.props.f) {
        //TODO: non-function values shouldn't be created in the first place
        //and they should be stored in __values directly from __props
        //NOTE: that will complicate value inheritance a bit in definitions
        //extending other definitions
        delete self[key];
        self.__values[key] = v.props;
      }
    });
    return self;
  }
}
