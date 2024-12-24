import { Scope, ScopeProps } from "../scope";
import { ValueProps } from "../value";
import { BaseFactory } from "./base";

export interface SlotProps extends ScopeProps {
  __type: 'slot';
  __name: string;
}

export class SlotFactory extends BaseFactory {
  protected override addChildren(
    _self: Scope,
    _proxy: Scope,
    _children?: { [key: string]: ValueProps }[]
  ) {
    // nop
  }
}
