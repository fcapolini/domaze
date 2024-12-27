import * as core from "../core/all";
import { Node } from "../html/dom";

export const ATTR_VALUE_PREFIX = 'attr_';

export interface ScopeProps extends core.ScopeProps {
  __id: string;
}

export interface Scope extends core.Scope {
  __dom: Node;
}
