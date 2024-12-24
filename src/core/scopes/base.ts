import { Scope, ScopeFactory, ScopeProps } from "../scope";
import { Context } from "../context";
import { Define } from "./define";
import { Value, ValueProps } from "../value";

export class BaseFactory implements ScopeFactory {
  ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  create(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
    const ret = this.make(props);
    parent && ret.__link(parent, before);
    return ret;
  }

  protected make(props: ScopeProps): Scope {
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
          self[key] = self.__ctx.newValue(this, key, props[key]);
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
    proto && this.addValues(self, proxy, proto.__values);
    this.addValues(self, proxy, props);

    const populateFromProto = (proto: Scope) => {
      if (proto.__props.__proto) {
        const p = this.ctx.protos.get(proto.__props.__proto);
        p && populateFromProto(p);
      }
      this.addChildren(self, proxy, proto?.__props.__children);
    }
    proto && populateFromProto(proto);
    this.addChildren(self, proxy, props.__children);

    return proxy;
  }

  protected addValues(
    _self: Scope,
    proxy: Scope,
    props: { [key: string]: ValueProps }
  ) {
    proxy.__add(props);
  }

  protected addChildren(
    _self: Scope,
    proxy: Scope,
    children?: { [key: string]: ValueProps }[]
  ) {
    children?.forEach(props => this.ctx.scopeFactory.create(props, proxy));
  }
}
