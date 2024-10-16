import * as acorn from 'acorn';
import { PageProps } from '../runtime/page';
import { NodeProps, NodeType } from '../runtime/node';
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
  global: Node;

  constructor() {
    this.global = new Node(this, null, -1);
  }
}

// =============================================================================
// Node
// =============================================================================
// this should always use all available fields in NodeProps
// as a way to keep in sync with the definition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dummyNodeProps: NodeProps = {
  id: 0,
  name: 'dummy',
  type: undefined,
  values: {},
  children: []
};

export class Node {
  page: Page;
  parent: Node | null;
  // props
  id: number;
  name?: string;
  type?: NodeType;
  values?: { [key: string]: Value };
  children?: Node[];

  constructor(page: Page, parent: Node | null, id: number) {
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
  node: Node;
  name: string;
  // props
  exp?: acorn.Expression;
  deps?: acorn.Expression[];

  constructor(node: Node, name: string) {
    this.node = node;
    this.name = name;
    node.values || (node.values = {});
    node.values[name] = this;
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
