import { Page } from "./page";
import { Scope } from "./scope";

export interface ValueProps {
  exp: ValueExp;
  deps?: ValueDep[];
}

export type ValueExp = (this: unknown) => unknown;
export type ValueDep = (this: unknown) => Value;
export type ValueCallback = (s: Scope, v: unknown) => unknown;

export class Value {

  constructor(page: Page, scope: Scope, props: ValueProps) {

  }

}
