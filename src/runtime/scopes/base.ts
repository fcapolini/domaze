import { OUT_OBJ_ID_ATTR } from "../../compiler/const";
import { RT_ATTR_VAL_PREFIX, RT_CLASS_VAL_PREFIX, RT_STYLE_VAL_PREFIX } from "../const";
import { Context } from "../context";
import { Scope, ScopeFactory, ScopeProps } from "../scope";
import { Value, ValueProps } from "../value";
import * as dom from "../../html/dom";

export class BaseFactory implements ScopeFactory {
  ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  create(props: ScopeProps, parent?: Scope, before?: Scope): Scope {
    const self = Object.create(null) as Scope;

    //
    // proxy
    //

    self.__target = self;
    self.__handler = {
      get: (_: any, key: string) => self.__get(key),
      set: (_: any, key: string, val: any) => self.__set(key, val),
    };
    const proxy = new Proxy(self, self.__handler);

    //
    // methods
    //

    self.__dispose = function() {
      const i = self.__parent ? self.__parent.__children.indexOf(this) : -1;
      i < 0 || self.__parent!.__children.splice(i, 1);
      this.__unlinkValues();
    }

    self.__link = function(parent: Scope, before?: Scope) {
      // link scope
      if (self.__props.__slot && parent.__slots) {
        const slot = parent.__slots.get(self.__props.__slot);
        if (slot) {
          parent = slot.__parent!;
          before ??= slot;
        }
      }
      this.__parent = parent;
      const i = before ? parent.__children.indexOf(before) : -1;
      i < 0 ? parent.__children.push(this) : parent.__children.splice(i, 0, this);
      if (this.__props.__name && this.__props.__type !== 'slot') {
        const props: { [key: string]: any } = {};
        props[this.__props.__name!] = { e: () => this };
        parent.__add(props);
      }
      // collect slot
      if (self.__props.__type === 'slot') {
        const name = self.__props.__name!;
        let instance: Scope | undefined = self;
        while (instance && !instance.__slots) {
          instance = instance.__parent;
        }
        const slots = instance?.__slots;
        if (slots) {
          slots.get(name)?.__dispose();
          slots.set(name, proxy);
        }
      }
      return this;
    }

    self.__add = function(props: ScopeProps) {
      Object.keys(props).forEach(key => {
        if (!key.startsWith('__')) {
          (self as any)[key] = BaseFactory.newValue(this, key, props[key]);
        }
      });
    }

    self.__get = function(key: string) {
      return key.startsWith('__')
        ? (self as any)[key]
        : (self.__cache.get(key) ?? self.__lookup(key))?.get();
    }

    self.__set = function(key: string, val: any) {
      return key.startsWith('__')
        ? (((self as any)[key] = val) ?? true)
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
      Object.keys(self).forEach(key => key.startsWith('__') || (self as any)[key].unlink());
      recur && self.__children.forEach((scope: Scope) => scope.__unlinkValues())
    }

    self.__linkValues = function (recur = true) {
      Object.keys(self).forEach(key => key.startsWith('__') || (self as any)[key].link());
      recur && self.__children.forEach((scope: Scope) => scope.__linkValues())
    }

    self.__updateValues = function (recur = true) {
      Object.keys(self).forEach(key => key.startsWith('__') || (self as any)[key].get());
      recur && self.__children.forEach((scope: Scope) => scope.__updateValues())
    }

    //
    // init
    //

    self.__ctx = this.ctx;
    self.__props = props;
    self.__children = [];
    self.__cache = new Map();

    parent && proxy.__link(parent, before);

    // props.__proto && this.inherit(props.__proto, proxy);
    // const proto = props.__proto
    //   ? this.ctx.protos.get(props.__proto)?.__target as Define
    //   : null;
    // proto && proto.__apply(proxy);

    if (parent) {
      const id = `${props.__id}`;
      const lookup = (p: Element): Element | null => {
        for (const n of p.childNodes) {
          if (n.nodeType === dom.NodeType.ELEMENT) {
            const v = (n as Element).getAttribute(OUT_OBJ_ID_ATTR);
            if (v) {
              if (v === id) {
                return n as Element;
              } else {
                continue;
              }
            }
            const ret = lookup(n as Element);
            if (ret) {
              return ret;
            }
          }
        }
        return null;
      }
      self.__view = lookup(parent.__view)!;
    } else {
      self.__view = this.ctx.props.doc as any;
    }

    this.addValues(self, proxy, props);

    this.addChildren(self, proxy, props.__children);

    if (self.__slots) {
      self.__slots.forEach(slot => slot.__dispose());
      delete self.__slots;
    }

    return proxy;
  }

  // protected inherit(protoName: string, proxy: Scope): Define | undefined {
  //   const proto = this.ctx.protos.get(protoName)?.__target as Define;
  //   proto && proto.__apply(proxy);
  //   return proto;
  // }

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
    children?.forEach(props => this.ctx.newScope(props, proxy));
  }

  static newValue(scope: Scope, key: string, props: ValueProps): Value {
    const ret = new Value(scope, props);
    if (key.startsWith(RT_ATTR_VAL_PREFIX)) {
      const name = key.substring(RT_ATTR_VAL_PREFIX.length);
      if (name === 'class') {
        ret.cb = (s, v) => {
          s.__view.className = (v ? `${v}` : '');
          return v;
        }
      } else {
        ret.cb = (s, v) => {
          s.__view.setAttribute(name, v ? `${v}` : '');
          return v;
        }
      }
      return ret;
    }
    if (key.startsWith(RT_CLASS_VAL_PREFIX)) {
      const name = key.substring(RT_CLASS_VAL_PREFIX.length);
      ret.cb = (s, v) => {
        if (v) {
          s.__view.classList.add(name);
        } else {
          s.__view.classList.remove(name);
        }
        return v;
      }
      return ret;
    }
    if (key.startsWith(RT_STYLE_VAL_PREFIX)) {
      const name = key.substring(RT_STYLE_VAL_PREFIX.length);
      ret.cb = (s, v) => {
        (s.__view as HTMLElement).style.setProperty(name, v ? `${v}` : null);
        return v;
      }
      return ret;
    }
    return ret;
  }
}
