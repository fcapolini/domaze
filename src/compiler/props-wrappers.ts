import { NodeType } from "../runtime/node";

export class PageWrapper {
  global: NodeWrapper;

  constructor() {
    this.global = new NodeWrapper(-1);
  }
}

export class NodeWrapper {
  id: number;
  type?: NodeType;
  name?: string;
  isolate?: boolean;
  values?: ValueWrapper[];
  children?: NodeWrapper[];

  constructor(id: number, parent?: NodeWrapper) {
    this.id = id;
    if (parent) {
      parent.children || (parent.children = []);
      parent.children.push(this);
    }
  }
}

export class ValueWrapper {

}
