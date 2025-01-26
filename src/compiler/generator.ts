import * as acorn from 'acorn';
import { SourceLocation } from '../html/server-dom';
import { CompilerScope } from "./loader";

// https://astexplorer.net

export function generate(root: CompilerScope): acorn.ExpressionStatement {
  return {
    type: 'ExpressionStatement',
    expression: genScope(root),
    ...genLoc(root.loc)
  };
}

function genLoc(loc: SourceLocation) {
  return { start: loc.i1, end: loc.i2, loc };
}

function genScope(scope: CompilerScope): acorn.ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: genScopeProps(scope),
    ...genLoc(scope.loc),
  };
}

function genScopeProps(scope: CompilerScope): acorn.Property[] {
  const ret: acorn.Property[] = [];
  //TODO
  return ret;
}
