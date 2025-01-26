import * as acorn from 'acorn';
import { SourceLocation } from '../html/server-dom';
import { CompilerProp, CompilerScope, CompilerValue } from "./compiler";

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
  scope.values && ret.push(genProperty(scope.loc, 'values', genValues(scope)));
  ret.push(genProperty(scope.loc, 'children', genArray(scope.loc, genScopeChildren(scope))));
  return ret;
}

function genValues(scope: CompilerScope): acorn.ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: Object.keys(scope.values!).map(key => {
      return genValue(scope.loc, key, scope.values![key]);
    }),
    ...genLoc(scope.loc),
  };
}

function genValue(loc: SourceLocation, key: string, value: CompilerValue): acorn.Property {
  return genProperty(loc, key, genObject(loc, genValueProps(value)));
}

function genValueProps(value: CompilerValue): acorn.Property[] {
  const ret: acorn.Property[] = [];
  ret.push(genValueExp(value));
  return ret;
}

function genValueExp(value: CompilerValue): acorn.Property {
  const loc = value.valLoc ?? value.keyLoc;
  return genProperty(loc, 'e', genFunction(loc,
    //TODO: check what null would mean and if it's valid/needed
    value.val === null || typeof value.val === 'string'
      ? genLiteral(loc, value.val)
      : value.val
  ))
}

function genScopeChildren(scope: CompilerScope): acorn.ObjectExpression[] {
  const ret: acorn.ObjectExpression[] = [];
  scope.children.forEach(child => ret.push(genScope(child)));
  return ret;
}

// =============================================================================
// util
// =============================================================================

function genFunction(loc: SourceLocation, exp: acorn.Expression): acorn.FunctionExpression {
  return {
    type: 'FunctionExpression',
    id: null,
    expression: false,
    generator: false,
    async: false,
    params: [],
    body: {
      type: 'BlockStatement',
      body: [{
        type: 'ReturnStatement',
        argument: exp,
        ...genLoc(loc),
      }],
      ...genLoc(loc),
    },
    ...genLoc(loc),
  }
}

function genObject(loc: SourceLocation, properties: acorn.Property[]): acorn.ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties,
    ...genLoc(loc),
  }
}

function genArray(loc: SourceLocation, elements: acorn.ObjectExpression[]): acorn.ArrayExpression {
  return {
    type: 'ArrayExpression',
    elements,
    ...genLoc(loc),
  };
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

function genLiteral(loc: SourceLocation, val: string | number | null): acorn.Literal {
  return {
    type: 'Literal',
    value: val,
    ...genLoc(loc),
  }
}
