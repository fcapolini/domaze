import { Scope } from "./scope";

export type ValueExp = () => any;
export type ValueDep = () => Value;

export interface ValueProps {
  e: ValueExp;
  d?: ValueDep[];
}

export class Value {
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

  set(val: any): true {
    //TODO
    return true;
  }

  update() {}

  link() {}
  unlink() {}
}
