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
    const proxy = this.init(self, props, parentSelf, before);
    return proxy;
  }

  init(
    self: Scope,
    props: ScopeProps,
    parentSelf?: Scope,
    before?: Scope
  ): Scope {
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

    self.__dispose = function () {
      const i = self.__parentSelf
        ? self.__parentSelf.__children.indexOf(this)
        : -1;
      i < 0 || self.__parentSelf!.__children.splice(i, 1);
      this.__unlinkValues();
      const e = self.__view;
      Object.keys(self).forEach(key => {
        if (!key.startsWith(k.RT_EVENT_VAL_PREFIX)) {
          return;
        }
        try {
          const evname = key.substring(k.RT_EVENT_VAL_PREFIX.length);
          const value = (self as any)[key] as Value;
          const listener = value.exp?.();
          e.removeEventListener(evname, listener);
        } catch (ignored) {}
      });
      e?.parentElement?.removeChild(e);
    };

    self.__link = function (parent: Scope, before?: Scope) {
      this.__parentSelf = parent;
      this.__parent = parent.__proxy;
      const i = before ? parent.__children.indexOf(before) : -1;
      i < 0
        ? parent.__children.push(this)
        : parent.__children.splice(i, 0, this);
      if (this.__props.__name && this.__props.__type !== "slot") {
        const props: { [key: string]: any } = {};
        props[this.__props.__name!] = { e: () => this };
        parent.__add(props);
      }
      return this;
    };

    self.__add = function (props: ScopeProps) {
      Object.keys(props).forEach((key) => {
        if (!key.startsWith("__")) {
          (self as any)[key] = BaseFactory.newValue(this, key, props[key]);
        }
      });
    };

    self.__get = function (key: string) {
      return key.startsWith("__")
        ? (self as any)[key]
        : (self.__cache.get(key) ?? self.__lookup(key))?.get();
    };

    self.__set = function (key: string, val: any) {
      return key.startsWith("__")
        ? ((self as any)[key] = val) ?? true
        : (self.__cache.get(key) ?? self.__lookup(key))?.set(val) ?? false;
    };

    self.__value = function (key: string) {
      return self.__cache.get(key) ?? self.__lookup(key);
    };

    self.__lookup = function (key: string) {
      let t: Scope | undefined = this;
      let v: Value;
      do {
        if ((v = (t as any)[key])) {
          t!.__cache.set(key, v);
          return v;
        }
      } while ((t = t!.__parentSelf));
      return undefined;
    };

    //
    // reactivity
    //

    self.__unlinkValues = function (recur = true) {
      self.__cache.clear();
      Object.keys(self).forEach(
        (key) => key.startsWith("__") || (self as any)[key].unlink()
      );
      recur &&
        self.__children.forEach((scope: Scope) => scope.__unlinkValues());
    };

    self.__linkValues = function (recur = true) {
      Object.keys(self).forEach(
        (key) => key.startsWith("__") || (self as any)[key].link()
      );
      recur && self.__children.forEach((scope: Scope) => scope.__linkValues());
    };

    self.__updateValues = function (recur = true) {
      Object.keys(self).forEach(
        (key) => key.startsWith("__") || (self as any)[key].get()
      );
      recur &&
        self.__children.forEach((scope: Scope) => scope.__updateValues());
    };

    //
    // init
    //

    self.__ctx = this.ctx;
    self.__props = props;
    self.__children = [];
    self.__cache = new Map();

    parentSelf && proxy.__link(parentSelf, before);

    const slotmap = parentSelf?.__props.__slotmap;
    const slot = props.__slot;
    const slotScopeId = !self.__view && slot && slotmap && slotmap[slot];
    if (slotScopeId) {
      self.__view = this.lookupSlottedView(props, parentSelf, slotScopeId)!;
    }

    if (!self.__view) {
      self.__view = this.lookupView(props, parentSelf?.__view)!;
    }

    this.addChildren(self, proxy, props.__children);

    this.addValues(self, proxy, props);

    return proxy;
  }

  protected lookupView(
    props: ScopeProps,
    parentView?: dom.Element
  ): dom.Element | null {
    if (parentView) {
      const id = `${props.__id}`;
      const lookup = (p: dom.Element): dom.Element | null => {
        const childNodes =
          p.tagName === "TEMPLATE"
            ? (p as dom.TemplateElement).content.childNodes
            : p.childNodes;
        for (const n of childNodes) {
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
      };
      return lookup(parentView)!;
    }
    return this.ctx.props.doc as any;
  }

  protected lookupSlottedView(
    props: ScopeProps,
    parentSelf: Scope,
    slotScopeId: number
  ): dom.Element | null {
    const scope = BaseFactory.lookupSlotScope(parentSelf, slotScopeId);
    return scope?.__view
      ? this.lookupView(props, scope.__view)
      : null;
  }

  static lookupSlotScope(scope: Scope, slotScopeId: number): Scope | null {
    scope.__props.__id
    if (scope.__props.__id === slotScopeId) {
      return scope;
    }
    for (const child of scope.__children) {
      const res = this.lookupSlotScope(child, slotScopeId);
      if (res) {
        return res;
      }
    }
    return null;
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
    children?.forEach((props) => this.ctx.newScope(props, _self));
  }

  static newValue(scope: Scope, key: string, props: ValueProps): Value {
    const ret = new Value(scope, props);

    if (key.startsWith(k.RT_ATTR_VAL_PREFIX)) {
      const name = key.substring(k.RT_ATTR_VAL_PREFIX.length);
      if (name === "class") {
        ret.cb = (s, v) => {
          s.__view.className = v ? `${v}` : "";
          return v;
        };
      } else {
        ret.cb = (s, v) => {
          if (v != null) {
            s.__view.setAttribute(name, `${v}`);
          } else {
            s.__view.removeAttribute(name);
          }
          return v;
        };
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
      };
      return ret;
    }

    if (key.startsWith(k.RT_STYLE_VAL_PREFIX)) {
      const name = key.substring(k.RT_STYLE_VAL_PREFIX.length);
      ret.cb = (s, v) => {
        s.__view.style.setProperty(name, v ? `${v}` : null);
        return v;
      };
      return ret;
    }

    if (key.startsWith(k.RT_EVENT_VAL_PREFIX)) {
      try {
        const name = key.substring(k.RT_EVENT_VAL_PREFIX.length);
        const listener = ret.exp?.call(scope);
        scope.__view.addEventListener(name, listener);
      } catch (ignored) {}
      return ret;
    }

    if (key.startsWith(k.RT_TEXT_VAL_PREFIX)) {
      const nr = key.substring(k.RT_TEXT_VAL_PREFIX.length);
      if (nr.includes("_")) {
        // normal dynamic texts are marked with comments
        let text = BaseFactory.lookupTextNode(scope.__view, nr)!;
        if (!text && scope.__props.__slotmap) {
          // this text element was moved to the default slot
          const id = scope.__props.__slotmap['default'];
          const slotScope = BaseFactory.lookupSlotScope(scope, id);
          text = BaseFactory.lookupTextNode(slotScope!.__view, nr)!;
        }
        if (text) {
          ret.cb = (s, v) => {
            text.textContent = v ? `${v}` : "";
          }
        };
      } else {
        // atomic dynamic texts use the single text child
        const text = scope.__view.childNodes[0] as dom.Text;
        ret.cb = (s, v) => {
          text.textContent = v ? `${v}` : "";
        };
      }
    }

    return ret;
  }

  static lookupTextNode(e: dom.Element, nr: string): dom.Text | null {
    const marker = k.RT_TEXT_MARKER1_PREFIX + nr;
    const lookup = (e: dom.Element): dom.Text | null => {
      const childNodes = e.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const n = childNodes[i];
        if (n.nodeType === dom.NodeType.ELEMENT) {
          if (!(n as dom.Element).getAttribute(OUT_OBJ_ID_ATTR)) {
            const ret = lookup(n as dom.Element);
            if (ret) {
              return ret;
            }
          }
        } else if (n.nodeType === dom.NodeType.COMMENT) {
          if ((n as dom.Comment).textContent === marker) {
            if (childNodes[i + 1].nodeType === dom.NodeType.COMMENT) {
              let p = e.parentElement;
              let doc = e.ownerDocument;
              while (!doc && p) {
                doc = p.ownerDocument;
                p = p.parentElement;
              }
              const ret = doc!.createTextNode("");
              e.insertBefore(ret, childNodes[i + 1]);
              return ret;
            }
            return childNodes[i + 1] as dom.Text;
          }
        }
      }
      return null;
    };
    const ret = lookup(e);
    return ret;
  }
}
