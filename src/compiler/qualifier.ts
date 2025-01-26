import * as acorn from 'acorn';
import { Source } from "../html/parser";
import { CompilerScope } from "./compiler";

export function qualify(source: Source, scope: CompilerScope): boolean {
  scope.values && Object.keys(scope.values).forEach(key => {
    const value = scope.values![key];
    if (value.val === null || typeof value.val === 'string') {
      return;
    }
    qualifyExpression(source, scope, key, value.val);
  });
  return source.errors.length === 0;
}

function qualifyExpression(
  source: Source,
  scope: CompilerScope,
  key: string,
  exp: acorn.Expression
) {

}
