import { Scope, ScopeProps } from "./scope";
import { BaseFactory } from "./scopes/base";

export class GlobalFactory extends BaseFactory {
  override create(_props: ScopeProps): Scope {
    const ret = super.create({ values: [
      //TODO: add global values
    ] });
    // write-protect global object
    // ret.__handler.set = () => false;
    return ret;
  }
}
