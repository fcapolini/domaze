import { Context } from "./context";
import { Value } from "./value";
import * as dom from "../html/dom";

/**
 * - '__'-prefixed keys are reserved to implementation details
 * - all other keys must have a value of type ValueProps
 */
export interface ScopeProps {
  [key: string]: any;
  __id?: number;
  __type?: 'foreach' | 'define' | 'slot';
  __proto?: string;
  __name?: string;
  __slot?: string;
  __children?: ScopeProps[];
}

export interface Scope {
  __ctx: Context;
  __parent?: Scope;
  __props: ScopeProps;
  __children: Scope[];
  __view: dom.Element;
  __slots?: Map<string, Scope>;
  __cache: Map<string, Value>;

  __dispose(): void;
  __link(parent: Scope, before?: Scope): this;

  __add(props: ScopeProps): void;
  __get(key: string): any;
  __set(key: string, val: any): boolean;
  __value(key: string): Value | undefined;
  __lookup(key: string): Value | undefined;

  __unlinkValues(recur?: boolean): void;
  __linkValues(recur?: boolean): void;
  __updateValues(recur?: boolean): void;

  __target: Scope;
  __handler: Handler;
  __proxy: Scope;
  __parentSelf?: Scope;
}

export interface Handler {
  get: (_: any, key: string) => any;
  set: (_: any, key: string, val: any) => boolean;
}

export interface ScopeFactory {
  create(props: ScopeProps, parent?: Scope, before?: Scope): Scope;
}
