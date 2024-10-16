import { ArrayExpression, Expression, Identifier, Literal, ObjectExpression, Property } from 'acorn';
import { SourceLocation } from '../../html/server-dom';

export function astLocation(l: SourceLocation) {
  return {
    start: l.i1,
    end: l.i2,
    loc: l
  };
}

export function astIdentifier(name: string, l: SourceLocation): Identifier {
  return {
    type: 'Identifier',
    name,
    ...astLocation(l)
  };
}

export function astProperty(key: string, e: Expression, l: SourceLocation): Property {
  return {
    type: 'Property',
    key: astIdentifier(key, l),
    value: e,
    kind: 'init',
    method: false,
    computed: false,
    shorthand: false,
    ...astLocation(l)
  };
}

export function astArrayExpression(l: SourceLocation): ArrayExpression {
  return {
    type: 'ArrayExpression',
    elements: [],
    ...astLocation(l)
  };
}

export function astObjectExpression(l: SourceLocation): ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: [],
    ...astLocation(l)
  };
}

export function astLiteral(
  value: string | number | boolean, l: SourceLocation
): Literal {
  return {
    type: 'Literal',
    value,
    ...astLocation(l)
  };
}

export function getProperty(
  o: ObjectExpression,
  name: string
): Expression | null {
  for (const i in o.properties) {
    const p = o.properties[i] as Property;
    const id = p.key as Identifier;
    if (id.name === name) {
      return p.value;
    }
  }
  return null;
}
