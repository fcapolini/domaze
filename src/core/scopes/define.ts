import { Scope, ScopeProps } from "../scope";
import { Value, ValueProps } from "../value";

export interface DefineProps extends ScopeProps {
  __type: 'define';
  __name: string;
}

export interface Define extends Scope {
  __values: { [key: string]: ValueProps };
}

/**
 * Turns a base scope into a define scope.
 * @param scope base scope
 * @returns augmented received scope
 */
export function makeDefine(scope: Scope): Define {
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
