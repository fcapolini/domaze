import { Page } from "../page";
import { Global } from "../global";
import { Node, NodeObj, NodeProps, NodeValues } from "../node";
import * as dom from '../../html/dom';
import * as k from '../consts';
import { Value, ValueProps } from "../value";

export class BaseNode implements Node {
  page: Page;
  props: NodeProps;
  id: number;
  dom: dom.Element;
  global?: Global;
  isolate?: boolean;
  values: NodeValues;
  obj!: NodeObj;
  name?: string;
  parent?: BaseNode;
  children: BaseNode[];

  constructor(page: Page, props: NodeProps, e: dom.Element, global?: Global) {
    this.page = page;
    this.props = props;
    this.id = props.id;
    this.dom = e;
    this.global = global;
    this.values = {};
    this.children = [];
  }

  setName(name?: string): this {
    this.name = name;
    return this;
  }

  setValues(values?: { [key: string]: ValueProps }): this {
    if (values) {
      Reflect.ownKeys(values).forEach(key => {
        const name = key as string;
        const v = this.page.newValue(this, name, values![name]);
        this.values[name] = v;
      });
    }
    return this;
  }

  linkTo(p: BaseNode, ref?: BaseNode): this {
    let i = ref ? p.children.indexOf(ref) : -1;
    i = i < 0 ? p.children.length : i;
    p.children.splice(i, 0, this);
    this.parent = p;
    !this.dom.parentElement
      && this.dom.tagName !== 'HTML'
      && p.dom.insertBefore(this.dom, ref?.dom ?? null);
    if (this.name) {
      if (!p.values[this.name]) {
        const that = this;
        // add name to parent node
        p.values[this.name] = new Value(this.page, p, {
          exp: function() { return that.obj; }
        });
      }
    }
    this.page.global.addEventListeners(this);
    this.linkValues();
    return this;
  }

  unlink(): this {
    this.unlinkValues();
    this.page.global.removeEventListeners(this);
    if (this.name && this.parent && this.parent.obj[this.name] === this.obj) {
      // remove name from parent node
      delete this.parent.values[this.name];
    }
    this.dom.unlink();
    const i = this.parent ? this.parent.children.indexOf(this) : -1;
    i >= 0 && this.parent!.children.splice(i, 1);
    delete this.parent;
    return this;
  }

  getText(id: string): dom.Text | undefined {
    const key = k.OUT_TEXT_MARKER1 + id;
    const f = (e: dom.Element): dom.Text | undefined => {
      for (let i = 0; i < e.childNodes.length; i++) {
        const n = e.childNodes[i];
        if (n.nodeType === dom.NodeType.ELEMENT) {
          const ret = f(n as dom.Element);
          if (ret) {
            return ret;
          }
        } else if (
          n.nodeType === dom.NodeType.COMMENT &&
          (n as dom.Comment).textContent === key
        ) {
          let ret = e.childNodes[i + 1] as dom.Text;
          if (ret.nodeType !== dom.NodeType.TEXT) {
            const t = e.ownerDocument?.createTextNode('');
            e.insertBefore(t!, ret);
            ret = t!;
          }
          return ret;
        }
      }
    };
    return f(this.dom);
  }

  // ===========================================================================
  // proxy object
  // ===========================================================================

  makeObj(): this {
    const that = this;
    const page = this.page;

    this.values[k.RT_ID_KEY] = page.newValue(this, k.RT_ID_KEY, {
      exp: function() { return that.props.id; }
    });
    this.values[k.RT_NAME_KEY] = page.newValue(this, k.RT_NAME_KEY, {
      exp: function() { return that.name; }
    });
    this.values[k.RT_DOM_KEY] = page.newValue(this, k.RT_DOM_KEY, {
      exp: function() { return that.dom; }
    });
    this.values[k.RT_ISOLATE_KEY] = page.newValue(this, k.RT_ISOLATE_KEY, {
      exp: function() { return !!that.isolate; }
    });
    this.values[k.RT_PARENT_KEY] = page.newValue(this, k.RT_PARENT_KEY, {
      exp: function() { return that.parent?.obj; }
    });
    this.values[k.RT_CHILDREN_KEY] = page.newValue(this, k.RT_CHILDREN_KEY, {
      exp: function() { return that.children.map(child => child.obj); }
    });
    this.values[k.RT_VALUE_KEY] = page.newValue(this, k.RT_VALUE_KEY, {
      exp: function() {
        return (key: string) => {
          let s: Node | false | undefined = that;
          do {
            if (s.values[key]) {
              return s.values[key];
            }
            s = !s.isolate && s.parent;
          } while (s);
          return undefined;
        };
      }
    });

    this.obj = new Proxy(this.values, {

      get: (target: { [key: string]: Value }, key: string | symbol) => {
        const v = target[key as string];
        if (v) {
          return v.get();
        }
        const isolate = target[k.RT_ISOLATE_KEY].get();
        const parent = !isolate && target[k.RT_PARENT_KEY].get();
        if (parent) {
          return (parent as { [key: string]: unknown })[key as string];
        } else if (this.global) {
          return this.global.obj[key as string];
        }
        return undefined;
      },

      set: (
        target: { [key: string]: Value },
        key: string | symbol,
        val: unknown
      ) => {
        if (!this.global) {
          // this is the global object and it's write protected
          // (it's got no reference to global cause it's the global itself)
          return false;
        }
        const v = target[key as string];
        if (v) {
          v.set(val);
          return true;
        }
        const isolate = target[k.RT_ISOLATE_KEY];
        const parent = isolate ? null : target[k.RT_PARENT_KEY];
        if (parent) {
          try {
            (parent.get() as NodeObj)[key as string] = val;
            return true;
          } catch (err) {
            return false;
          }
        }
        return false;
      },

      defineProperty: (_: { [key: string]: Value }, __: string | symbol) => {
        return false;
      },

      deleteProperty: (_: { [key: string]: Value }, __: string | symbol) => {
        return false;
      },
    });

    return this;
  }

  // ===========================================================================
  // refresh
  // ===========================================================================

  unlinkValues(recur = true) {
    this.foreachValue(v => {
      v.src.forEach(o => o.dst.delete(v));
      v.dst.forEach(o => o.src.delete(v));
    });
    recur && this.children.forEach(s => s.unlinkValues());
  }

  linkValues(recur = true) {
    this.foreachValue(v => {
      v.props.deps?.forEach(dep => {
        try {
          const o = dep.apply(this.obj);
          o.dst.add(v);
          v.src.add(o);
        } catch (ignored) { /* nop */ }
      });
    });
    recur && this.children.forEach(s => s.linkValues());
  }

  updateValues(recur = true) {
    this.foreachValue(v => v.get());
    recur && this.children.forEach(s => s.updateValues());
  }

  protected foreachValue(cb: (v: Value) => void) {
    const values = this.values;
    (Reflect.ownKeys(values) as string[]).forEach(k => cb(values[k]));
  }
}
