import * as acorn from 'acorn';
import { SourceLocation } from '../html/server-dom';
import { CompilerProp, CompilerScope } from "./compiler";

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
  ret.push(genProperty(scope.loc, 'id', genLiteral(scope.loc, scope.id)));
  scope.name && ret.push(genProperty(
      scope.name.keyLoc,
      'name',
      genLiteral(scope.name.valLoc ?? scope.name.keyLoc, scope.name.val)
  ));
  ret.push(genProperty(scope.loc, 'children', genArray(scope.loc, genScopeChildren(scope))));
  return ret;
}

function genArray(loc: SourceLocation, elements: acorn.ObjectExpression[]): acorn.ArrayExpression {
  return {
    type: 'ArrayExpression',
    elements,
    ...genLoc(loc),
  };
}

function genScopeChildren(scope: CompilerScope): acorn.ObjectExpression[] {
  const ret: acorn.ObjectExpression[] = [];
  scope.children.forEach(child => ret.push(genScope(child)));
  return ret;
}

function genProperty(
  loc: SourceLocation,
  key: string,
  val: acorn.Expression
): acorn.Property {
  return {
    type: "Property",
    key: genIdentifier(loc, key),
    value: val,
    kind: "init",
    method: false,
    shorthand: false,
    computed: false,
    ...genLoc(loc),
  };
}

function genIdentifier(loc: SourceLocation, name: string): acorn.Identifier {
  return {
    type: 'Identifier',
    name,
    ...genLoc(loc),
  }
}

function genLiteral(loc: SourceLocation, val: string | number): acorn.Literal {
  return {
    type: 'Literal',
    value: val,
    ...genLoc(loc),
  }
}
