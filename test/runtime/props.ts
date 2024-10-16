import { PageProps } from "../../src/runtime/page";
import { NodeProps } from "../../src/runtime/node";
import { ValueProps } from "../../src/runtime/value";

export class Page {
  props: PageProps;

  constructor() {
    this.props = { root: { id: 0 }};
  }

  add(node: Node): this {
    this.props.root = node.props;
    return this;
  }
}

export class Node {
  props: NodeProps;

  constructor(props: NodeProps, values?: { [key: string]: ValueProps }) {
    this.props = props;
    this.props.values = values;
  }

  add(node: Node): this {
    this.props.children || (this.props.children = []);
    this.props.children.push(node.props);
    return this;
  }
}
