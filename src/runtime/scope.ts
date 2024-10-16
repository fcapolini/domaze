import * as dom from '../html/dom';
import * as k from './consts';
import { Global } from "./global";
import { Page } from "./page";
import { Value, ValueProps } from "./value";

export type ScopeType = 'foreach';

export interface ScopeProps {
  id: number;
  name?: string;
  type?: ScopeType;
  values?: { [key: string]: ValueProps };
  children?: ScopeProps[];
}

export type ScopeValues = { [key: string]: Value };
export type ScopeObj = { [key: string]: unknown };

export interface Scope {
  page: Page;
  id: number;
  dom: dom.Element;
  global?: Global;
  isolate?: boolean;
  values: ScopeValues;
  obj: ScopeObj;
  name?: string;
  parent?: Scope;
  children: Scope[];

  setName(name?: string): this;
  setValues(values?: { [key: string]: ValueProps }): this;
  makeObj(): this;
  linkTo(p: Scope, ref?: Scope): this;
  unlinkValues(): void;
  linkValues(): void;
  updateValues(): void;
  getText(id: string): dom.Text | undefined;
}
