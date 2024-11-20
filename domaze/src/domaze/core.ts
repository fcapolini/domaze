
// =============================================================================
// Context
// =============================================================================

export class Context {
  global: Global;

  constructor(props: ScopeProps) {
    this.global = new Global(props);
  }
}

// =============================================================================
// Scope
// =============================================================================

export interface ScopeProps {
  id?: string;
  name?: string;
  values?: { [key: string]: ValueProps };
  children?: ScopeProps[];
}

class Scope {
  props: ScopeProps;
  values: { [key: string]: Value };
  parent: Scope | null;
  children: Scope[];

  constructor(parent: Scope | null, props: ScopeProps) {
    this.props = props;
    this.values = {};
    props.values && Reflect.ownKeys(props.values).forEach((key) => {
      if (typeof key === 'string') {
        this.values[key] = new Value(this, props.values![key]);
      }
    });
    if ((this.parent = parent) && props.name) {
      parent.values[props.name] = new Value(parent, { exp: () => this });
    }
    this.children = props.children
      ? props.children.map((childProps) => new Scope(this, childProps))
      : [];
  }
}

// =============================================================================
// Global
// =============================================================================

export class Global extends Scope {
  root: Scope;

  constructor(props: ScopeProps) {
    super(null, {});
    this.root = new Scope(this, props);
  }
}

// =============================================================================
// Value
// =============================================================================

export type ValueExp = () => any;
export type ValueDep = () => Value;

export interface ValueProps {
  exp: () => any;
  deps?: ValueDep[];
}

class Value {
  scope: Scope;
  props: ValueProps;
  
  constructor(scope: Scope, props: ValueProps) {
    this.scope = scope;
    this.props = props;
  }
}
