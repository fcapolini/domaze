import { ScopeType } from "../runtime/scope";

export class PageWrapper {
  global: ScopeWrapper;

  constructor() {
    this.global = new ScopeWrapper(-1);
  }
}

export class ScopeWrapper {
  id: number;
  type?: ScopeType;
  name?: string;
  isolate?: boolean;
  values?: ValueWrapper[];
  children?: ScopeWrapper[];

  constructor(id: number, parent?: ScopeWrapper) {
    this.id = id;
    if (parent) {
      parent.children || (parent.children = []);
      parent.children.push(this);
    }
  }
}

export class ValueWrapper {

}
