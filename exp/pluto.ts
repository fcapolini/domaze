
// =============================================================================
// Scope
// =============================================================================

/**
 * - '__'-prefixed keys are reserved to implementation details
 * - all other keys must have a value of type ValueProps
 */
interface ScopeProps {
  [key: string]: any;
  __name?: string;
  __children?: ScopeProps[];
}

class Scope {
  __parent?: Scope;
  __props: ScopeProps;
  __children: Scope[];
  __cache: Map<string, Value>;

  constructor(props: ScopeProps) {
    this.__props = props;
    this.__children = [];
    this.__cache = new Map();
    this.__add(props);
  }

  __add(props: ScopeProps) {
    Object.keys(props).forEach(key => {
      key.startsWith('__') || ((this as any)[key] = new Value(this, props[key]));
    });
  }

  __get(key: string): any {
    return key.startsWith('__')
      ? (this as any)[key]
      : (this.__cache.get(key) ?? this.__lookup(key))?.get();
  }

  __set(key: string, val: any): boolean {
    return false;//TODO
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
}

// =============================================================================
// Value
// =============================================================================

type ValueExp = () => any;
type ValueDep = () => Value;

interface ValueProps {
  e: ValueExp;
  d?: ValueDep[];
}

class Value {
  scope: Scope;
  props: ValueProps;
  exp: ValueExp;

  constructor(scope: Scope, props: ValueProps) {
    this.scope = scope;
    this.props = props;
    this.exp = props.e;
  }

  get(): any {
    return this.exp.apply(this.scope);
  }
}

// =============================================================================
// Test
// =============================================================================

function make(parent: Scope | undefined, props: ScopeProps, before?: Scope): any {
  const ret = new Proxy(new Scope(props), {
    get: (scope: Scope, key: string) => scope.__get(key),
    set: (scope: Scope, key: string, val: any) => scope.__set(key, val),
  });
  parent && ret.__link(parent, before);
  props.__children?.forEach(props => make(ret, props));
  return ret;
}

const app = make(undefined, {
  v1: { e: function() { return 1; } },
  __children: [{
    v2: { e: function() { return 2; } },
  }],
});

console.log(app.v1);
console.log(app.__children[0].v2);
