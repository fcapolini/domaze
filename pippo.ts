
type ValueExp = () => any;
type ValueDep = () => Value | undefined;

interface ValueProps {
  e: ValueExp;
  d?: ValueDep[];
}

interface Value {
  scope: Scope;
  props: ValueProps;
}

interface ScopeProps {
  [key: string]: any;
  __name?: string;
  __children?: ScopeProps[];
}

interface Scope {
  __parent?: Scope;
  __props: ScopeProps;
  __name?: string;
  __children?: Scope[];
}

function Scope(parent: Scope | undefined, props: ScopeProps) {
  this.__parent = parent;
  this.__props = props;
  Object.keys(props).forEach(key => {
    if (typeof key !== 'string' || key.startsWith('__')) {
      return;
    }
    this[key] = new Value(this, props[key]);
  });
}

function Value(scope: Scope, props: ValueProps) {
  this.scope = scope;
  this.props = props;
}

function make(parent: Scope | undefined, props: ScopeProps) {
  return new Proxy(new Scope(parent, props), {

  });
}

const app = make(undefined, {
  __name: 'page',
  v1: { e: function() { return 1; } },
  __children: [{
    __name: 'head',
  }, {
    __name: 'body',
  }]
});
