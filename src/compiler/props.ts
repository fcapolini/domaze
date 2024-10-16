import * as acorn from 'acorn';
import { PageProps } from '../runtime/page';
import { ScopeProps, ScopeType } from '../runtime/scope';
import { ValueProps } from '../runtime/value';

// =============================================================================
// Page
// =============================================================================
// this should always use all available fields in PageProps
// as a way to keep in sync with the definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dummyPageProps: PageProps = {
  root: { id: 0 }
};

export class Page {
  global: Scope;

  constructor() {
    this.global = new Scope(this, null, -1);
  }
}

// =============================================================================
// Scope
// =============================================================================
// this should always use all available fields in ScopeProps
// as a way to keep in sync with the definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dummyScopeProps: ScopeProps = {
  id: 0,
  name: 'dummy',
  type: undefined,
  values: {},
  children: []
};

export class Scope {
  page: Page;
  parent: Scope | null;
  // props
  id: number;
  name?: string;
  type?: ScopeType;
  values?: { [key: string]: Value };
  children?: Scope[];

  constructor(page: Page, parent: Scope | null, id: number) {
    this.page = page;
    this.parent = parent;
    this.id = id;
    if (parent) {
      parent.children || (parent.children = []);
      parent.children.push(this);
    }
  }
}

// =============================================================================
// Value
// =============================================================================
// this should always use all available fields in ValueProps
// as a way to keep in sync with the definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dummyValueProps: ValueProps = {
  exp: function() { return 0; },
  deps: []
}

export class Value {
  scope: Scope;
  name: string;
  // props
  exp?: acorn.Expression;
  deps?: acorn.Expression[];

  constructor(scope: Scope, name: string) {
    this.scope = scope;
    this.name = name;
    scope.values || (scope.values = {});
    scope.values[name] = this;
  }

  setExp(exp: acorn.Expression): this {
    this.exp = exp;
    return this;
  }

  addDep(dep: acorn.Expression): this {
    this.deps || (this.deps = []);
    this.deps.push(dep);
    return this;
  }
}
