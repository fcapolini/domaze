import * as core from "../core/all";
import { Node } from "../html/dom";
import { Define } from "./scopes/define";

export const ATTR_VALUE_PREFIX = 'attr_';
export const CLASS_VALUE_PREFIX = 'class_';
export const STYLE_VALUE_PREFIX = 'style_';

export interface ScopeProps extends core.ScopeProps {
  __id: string;
}

export interface Scope extends core.Scope {
  __dom: Node;
}

export class ScopeFactory extends core.BaseFactory {

  protected override inherit(protoName: string, proxy: core.Scope): Define | undefined {
    const proto = super.inherit(protoName, proxy);
    //TODO: clone template
    return proto as Define;
  }

}
