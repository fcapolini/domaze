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

export class Scope {
  __ctx: Context;
  __parent?: Scope;
  __props: ScopeProps;
  __children: Scope[];
  __cache: Map<string, Value>;

  constructor(ctx: Context, props: ScopeProps) {
    this.__ctx = ctx;
    this.__props = props;
    this.__children = [];
    this.__cache = new Map();
    this.__add(props);
  }

  __add(props: ScopeProps) {
    Object.keys(props).forEach(key => {
      if (!key.startsWith('__')) {
        (this as any)[key] = this.__ctx.valueFactory(this, props[key]);
      }
    });
  }

  __get(key: string): any {
    return key.startsWith('__')
      ? (this as any)[key]
      : (this.__cache.get(key) ?? this.__lookup(key))?.get();
  }

  __set(key: string, val: any): boolean {
    return key.startsWith('__')
      ? (((this as any)[key] = val) ?? true)
      : ((this.__cache.get(key) ?? this.__lookup(key))?.set(val) ?? false);
  }

  __value(key: string): Value | undefined {
    return this.__cache.get(key) ?? this.__lookup(key);
  }

  __lookup(key: string): Value | undefined {
    let t: Scope | undefined = this;
    let v: Value;
    do {
      if ((v = (t as any)[key])) {
        t.__cache.set(key, v);
        return v;
      }
    } while ((t = t.__parent));
    return undefined;
  }

  __link(parent: Scope, before?: Scope): this {
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

  // ===========================================================================

  __unlinkValues() {}
  __linkValues() {}
  __updateValues() {}
}
