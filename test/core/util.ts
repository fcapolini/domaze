import { Scope } from "../../src/core/scope";

export function dump(scope: Scope): string {
  const f = (scope: Scope, level = 0) => {
    const values = [
      ...(Reflect.ownKeys(scope.__props) as string[])
        .filter(s => !s.startsWith('__'))
    ];
    return {
      type: scope.__props.__type,
      name: scope.__props.__name,
      proto: scope.__props.__proto,
      values: values.length ? values.join(', ') : undefined,
      children: scope.__children.length
        ? [...scope.__children.map(child => f(child))]
        : undefined,
    }
  }
  const obj = f(scope);
  return JSON.stringify(obj, undefined, 2);
}
