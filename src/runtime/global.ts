import { Scope, ScopeProps } from "./scope";
import { BaseFactory } from "./scopes/base";

export class GlobalFactory extends BaseFactory {
  override create(props: ScopeProps): Scope {
    const ret = super.create(props);
    // ret.__view = this.ctx.props.doc.documentElement as any;
    // write-protect global object
    ret.__handler.set = () => false;
    return ret;
  }
}
