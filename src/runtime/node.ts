import * as dom from '../html/dom';
import * as k from './consts';
import { Global } from "./global";
import { Page } from "./page";
import { Value, ValueProps } from "./value";

export type NodeType = 'foreach';

export interface NodeProps {
  id: number;
  name?: string;
  type?: NodeType;
  values?: { [key: string]: ValueProps };
  children?: NodeProps[];
}

export type NodeValues = { [key: string]: Value };
export type NodeObj = { [key: string]: unknown };

export interface Node {
  page: Page;
  id: number;
  dom: dom.Element;
  global?: Global;
  isolate?: boolean;
  values: NodeValues;
  obj: NodeObj;
  name?: string;
  parent?: Node;
  children: Node[];

  setName(name?: string): this;
  setValues(values?: { [key: string]: ValueProps }): this;
  makeObj(): this;
  linkTo(p: Node, ref?: Node): this;
  unlinkValues(): void;
  linkValues(): void;
  updateValues(): void;
  getText(id: string): dom.Text | undefined;
}
