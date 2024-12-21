import { Context } from "./context";
import { ScopeFactory } from "./scopes/base";
import { Define } from "./scopes/define";
import { Value } from "./value";

/**
 * - '__'-prefixed keys are reserved to implementation details
 * - all other keys must have a value of type ValueProps
 */
export interface ScopeProps {
  [key: string]: any;
  __type?: 'foreach' | 'define';
  __proto?: string;
  __name?: string;
  __children?: ScopeProps[];
}

export interface Scope {
  __ctx: Context;
  __parent?: Scope;
  __props: ScopeProps;
  __children: Scope[];
  __cache: Map<string, Value>;

  __dispose(): void;
  __link(parent: Scope, before?: Scope): this;

  __add(props: ScopeProps): void;
  __get(key: string): any;
  __set(key: string, val: any): boolean;
  __value(key: string): Value | undefined;
  __lookup(key: string): Value | undefined;

  __unlinkValues(recur?: boolean): void;
  __linkValues(recur?: boolean): void;
  __updateValues(recur?: boolean): void;

  __target: Scope;
  __handler: any;
}

export class BaseFactory implements ScopeFactory {
  ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  create(props: ScopeProps, parent: Scope, before?: Scope): Scope {
    const ret = this.make(props);
    ret.__link(parent, before);
    props.__children?.forEach(props => this.ctx.create(props, ret));
    return ret;
  }

  make(props: ScopeProps): Scope {
    const proto = props.__proto
      ? this.ctx.protos.get(props.__proto)?.__target as Define
      : null;
    const self = Object.create(proto ?? null) as Scope;

    //
    // methods
    //

    self.__dispose = function() {
      const i = self.__parent ? self.__parent.__children.indexOf(this) : -1;
      i < 0 || self.__parent!.__children.splice(i, 1);
      this.__unlinkValues();
    }

    self.__link = function(parent: Scope, before?: Scope) {
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

    self.__add = function(props: ScopeProps) {
      Object.keys(props).forEach(key => {
        if (!key.startsWith('__')) {
          self[key] = self.__ctx.valueFactory(this, key, props[key]);
        }
      });
    }

    self.__get = function(key: string) {
      return key.startsWith('__')
        ? self[key]
        : (self.__cache.get(key) ?? self.__lookup(key))?.get();
    }

    self.__set = function(key: string, val: any) {
      return key.startsWith('__')
        ? ((self[key] = val) ?? true)
        : ((self.__cache.get(key) ?? self.__lookup(key))?.set(val) ?? false);
    }

    self.__value = function(key: string) {
      return self.__cache.get(key) ?? self.__lookup(key);
    }

    self.__lookup = function(key: string) {
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

    self.__unlinkValues = function(recur = true) {
      self.__cache.clear();
      Object.keys(self).forEach(key => key.startsWith('__') || self[key].unlink());
      recur && self.__children.forEach((scope: Scope) => scope.__unlinkValues())
    }

    self.__linkValues = function (recur = true) {
      Object.keys(self).forEach(key => key.startsWith('__') || self[key].link());
      recur && self.__children.forEach((scope: Scope) => scope.__linkValues())
    }

    self.__updateValues = function (recur = true) {
      Object.keys(self).forEach(key => key.startsWith('__') || self[key].get());
      recur && self.__children.forEach((scope: Scope) => scope.__updateValues())
    }

    //
    // proxy
    //

    self.__target = self;
    self.__handler = {
      get: (_, key: string) => self.__get(key),
      set: (_, key: string, val: any) => self.__set(key, val),
    };
    const proxy = new Proxy(self, self.__handler);

    //
    // init
    //

    self.__ctx = this.ctx;
    self.__props = props;
    self.__children = [];
    self.__cache = new Map();
    proto && proxy.__add(proto.__values);
    proxy.__add(props);
    proto?.__props.__children?.forEach(props => this.ctx.create(props, proxy));

    return proxy;
  }
}
