import estraverse from 'estraverse';
import * as es from 'estree';
import { PageError, Source } from "../html/parser";
import { CompilerScope, CompilerValue } from "./compiler";

export function validate(source: Source, root: CompilerScope): boolean {
  const validate = (scope: CompilerScope) => {
    scope.values && Object.keys(scope.values).forEach(key => {
      const value = scope.values![key];
      validateValue(source, value);
    });
    scope.children.forEach(child => validate(child));
  }
  validate(root);
  return (source.errors.length === 0);
}

function validateValue(source: Source, value: CompilerValue) {
  if (typeof value.val !== 'object') {
    return;
  }
  estraverse.traverse(value.val as es.Node, {
    enter: (node) => {
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression'
      ) {
        addError(source, value, 'only arrow functions allowed', node.loc!);
      }
    }
  });
}

function addError(
  source: Source,
  value: CompilerValue,
  msg: string,
  loc?: es.SourceLocation
) {
  loc || (loc = value.valLoc ?? value.keyLoc);
  source.errors.push(new PageError("error", msg, loc));
}
