import { Context } from "./context";
import { Value } from "./value";

/**
 * - '__'-prefixed keys are reserved to implementation details
 * - all other keys must have a value of type ValueProps
 */
export interface ScopeProps {
  [key: string]: any;
  __name?: string;
  __children?: ScopeProps[];
}

export interface Scope {
  __ctx: Context;
  __parent?: Scope;
  __props: ScopeProps;
  __children: Scope[];
  __cache: Map<string, Value>;

  __link: (parent: Scope, before?: Scope) => this;

  __add: (props: ScopeProps) => void;
  __get: (key: string) => any;
  __set: (key: string, val: any) => boolean;
  __value: (key: string) => Value | undefined;
  __lookup: (key: string) => Value | undefined;

  __unlinkValues: (recur?: boolean) => void;
  __linkValues: (recur?: boolean) => void;
  __updateValues: (recur?: boolean) => void;

  // __target: Scope;
  __handler: any;
}

export function newScope(ctx: Context, props: ScopeProps): Scope {
  const ret = Object.create(null) as Scope;

  //
  // methods
  //

  ret.__link = function(parent: Scope, before?: Scope) {
    this.__parent = parent;
    const i = before ? parent.__children.indexOf(before) : -1;
    i < 0 ? parent.__children.push(this) : parent.__children.splice(i, 0, this);
    if (this.__props.__name) {
      const props = {};
      props[this.__props.__name] = { e: () => this };
      parent.__add(props);
    }
    return this;
  }

  ret.__add = function(props: ScopeProps) {
    Object.keys(props).forEach(key => {
      if (!key.startsWith('__')) {
        ret[key] = ret.__ctx.valueFactory(this, props[key]);
      }
    });
  }

  ret.__get = function(key: string) {
    return key.startsWith('__')
      ? ret[key]
      : (ret.__cache.get(key) ?? ret.__lookup(key))?.get();
  }

  ret.__set = function(key: string, val: any) {
    return key.startsWith('__')
      ? ((ret[key] = val) ?? true)
      : ((ret.__cache.get(key) ?? ret.__lookup(key))
      ?.set(val)
      ?? false);
  }

  ret.__value = function(key: string) {
    return ret.__cache.get(key) ?? ret.__lookup(key);
  }

  ret.__lookup = function(key: string) {
    let t: Scope | undefined = this;
    let v: Value;
    do {
      if ((v = (t as any)[key])) {
        t!.__cache.set(key, v);
        return v;
      }
    } while ((t = t!.__parent));
    return undefined;
  }

  //
  // reactivity
  //

  ret.__unlinkValues = function(recur = true) {
    ret.__cache.clear();
    Object.keys(ret).forEach(key => key.startsWith('__') || ret[key].unlink());
    recur && ret.__children.forEach((scope: Scope) => scope.__unlinkValues())
  }

  ret.__linkValues = function (recur = true) {
    Object.keys(ret).forEach(key => key.startsWith('__') || ret[key].link());
    recur && ret.__children.forEach((scope: Scope) => scope.__linkValues())
  }

  ret.__updateValues = function (recur = true) {
    Object.keys(ret).forEach(key => key.startsWith('__') || ret[key].get());
    recur && ret.__children.forEach((scope: Scope) => scope.__updateValues())
  }

  //
  // init
  //

  ret.__ctx = ctx;
  ret.__props = props;
  ret.__children = [];
  ret.__cache = new Map();
  ret.__add(props);

  //
  // proxy
  //

  // ret.__target = ret;
  ret.__handler = {
    get: (_, key: string) => ret.__get(key),
    set: (_, key: string, val: any) => ret.__set(key, val),
  };
  return new Proxy(ret, ret.__handler);
}
