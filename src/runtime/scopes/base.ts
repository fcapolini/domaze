import { OUT_OBJ_ID_ATTR } from "../../compiler/const";
import * as dom from "../../html/dom";
import * as k from "../const";
import { Context } from "../context";
import { Scope, ScopeFactory, ScopeProps } from "../scope";
import { Value, ValueProps } from "../value";

export class BaseFactory implements ScopeFactory {
  ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  create(props: ScopeProps, parentSelf?: Scope, before?: Scope): Scope {
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
    // @ts-ignore
    self.__proxy = proxy;

    //
    // methods
    //

    self.__dispose = function() {
      const i = self.__parentSelf ? self.__parentSelf.__children.indexOf(this) : -1;
      i < 0 || self.__parentSelf!.__children.splice(i, 1);
      this.__unlinkValues();
    }

    self.__link = function(parent: Scope, before?: Scope) {
      // link scope
      if (self.__props.__slot && parent.__slots) {
        const slot = parent.__slots.get(self.__props.__slot);
        if (slot) {
          parent = slot.__parentSelf!;
          before ??= slot;
        }
      }
      this.__parentSelf = parent;
      this.__parent = parent.__proxy;
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
          instance = instance.__parentSelf;
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
      } while ((t = t!.__parentSelf));
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

    parentSelf && proxy.__link(parentSelf, before);

    // props.__proto && this.inherit(props.__proto, proxy);
    // const proto = props.__proto
    //   ? this.ctx.protos.get(props.__proto)?.__target as Define
    //   : null;
    // proto && proto.__apply(proxy);

    if (parentSelf) {
      const id = `${props.__id}`;
      const lookup = (p: dom.Element): dom.Element | null => {
        for (const n of p.childNodes) {
          if (n.nodeType === dom.NodeType.ELEMENT) {
            const v = (n as dom.Element).getAttribute(OUT_OBJ_ID_ATTR);
            if (v) {
              if (v === id) {
                return n as dom.Element;
              } else {
                continue;
              }
            }
            const ret = lookup(n as dom.Element);
            if (ret) {
              return ret;
            }
          }
        }
        return null;
      }
      self.__view = lookup(parentSelf.__view)!;
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
    children?.forEach(props => this.ctx.newScope(props, _self));
  }

  static newValue(scope: Scope, key: string, props: ValueProps): Value {
    const ret = new Value(scope, props);

    if (key.startsWith(k.RT_ATTR_VAL_PREFIX)) {
      const name = key.substring(k.RT_ATTR_VAL_PREFIX.length);
      if (name === 'class') {
        ret.cb = (s, v) => {
          s.__view.className = (v ? `${v}` : '');
          return v;
        }
      } else {
        ret.cb = (s, v) => {
          if (v != null) {
            s.__view.setAttribute(name, `${v}`);
          } else {
            s.__view.removeAttribute(name);
          }
          return v;
        }
      }
      return ret;
    }

    if (key.startsWith(k.RT_CLASS_VAL_PREFIX)) {
      const name = key.substring(k.RT_CLASS_VAL_PREFIX.length);
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

    if (key.startsWith(k.RT_STYLE_VAL_PREFIX)) {
      const name = key.substring(k.RT_STYLE_VAL_PREFIX.length);
      ret.cb = (s, v) => {
        s.__view.style.setProperty(name, v ? `${v}` : null);
        return v;
      }
      return ret;
    }

    if (key.startsWith(k.RT_TEXT_VAL_PREFIX)) {
      const nr = key.substring(k.RT_TEXT_VAL_PREFIX.length);
      if (nr.length) {
        // normal dynamic texts are marked with comments
        const text = BaseFactory.lookupTextNode(scope.__view, nr)!;
        ret.cb = (s, v) => {
          text.textContent = v ? `${v}` : '';
        }
      } else {
        // atomic dynamic texts use the single text child
        const text = scope.__view.childNodes[0] as dom.Text;
        ret.cb = (s, v) => {
          text.textContent = v ? `${v}` : '';
        }
      }
    }

    return ret;
  }

  static lookupTextNode(e: dom.Element, nr: string): dom.Text | null {
    const marker = k.RT_TEXT_MARKER1_PREFIX + nr;
    const lookup = (e: dom.Element): dom.Text | null => {
      for (let i = 0; i < e.childNodes.length; i++) {
        const n = e.childNodes[i];
        if (n.nodeType === dom.NodeType.ELEMENT) {
          if (!(n as dom.Element).getAttribute(OUT_OBJ_ID_ATTR)) {
            const ret = lookup(n as dom.Element);
            if (ret) {
              return ret;
            }
          }
        } else if (n.nodeType === dom.NodeType.COMMENT) {
          if ((n as dom.Comment).textContent === marker) {
            if (e.childNodes[i + 1].nodeType === dom.NodeType.COMMENT) {
              const ret = e.ownerDocument!.createTextNode('');
              e.insertBefore(ret, e.childNodes[i + 1]);
              return ret;
            }
            return e.childNodes[i + 1] as dom.Text;
          }
        }
      }
      return null;
    }
    return lookup(e);
  }
}
