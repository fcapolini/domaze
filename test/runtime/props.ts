import { PageProps } from "../../src/runtime/page";
import { ScopeProps } from "../../src/runtime/scope";
import { ValueProps } from "../../src/runtime/value";

export class Page {
  props: PageProps;

  constructor() {
    this.props = { root: { id: 0 }};
  }

  add(scope: Scope): this {
    this.props.root = scope.props;
    return this;
  }
}

export class Scope {
  props: ScopeProps;

  constructor(props: ScopeProps, values?: { [key: string]: ValueProps }) {
    this.props = props;
    this.props.values = values;
  }

  add(scope: Scope): this {
    this.props.children || (this.props.children = []);
    this.props.children.push(scope.props);
    return this;
  }
}
