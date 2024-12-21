import { Scope, ScopeProps } from "../scope";

export interface ScopeFactory {
  create(props: ScopeProps, parent: Scope, before?: Scope): Scope;
}
