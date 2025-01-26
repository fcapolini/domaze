import { Source } from "../html/parser";
import { CompilerScope } from "./compiler";

export function validate(source: Source, root: CompilerScope): boolean {
  let ret = true;
  const validate = (scope: CompilerScope) => {
    scope.values && Object.keys(scope.values).forEach(key => {
      const value = scope.values![key];
      //TODO
    });
    scope.children.forEach(child => validate(child));
  }
  validate(root);
  return ret;
}
