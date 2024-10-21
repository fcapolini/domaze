import * as es from 'estree';

export function getProperty(
  o: es.ObjectExpression,
  name: string
): es.Node | null {
  for (const i in o.properties) {
    const p = o.properties[i] as es.Property;
    const id = p.key as es.Identifier;
    if (id.name === name) {
      return p.value;
    }
  }
  return null;
}

export function getPropertyName(e: es.MemberExpression): string | undefined {
  const p = e.property;
  if (p.type === 'Identifier') {
    return p.name;
  }
  if (p.type === 'Literal' && typeof p.value === 'string') {
    return p.value;
  }
  return undefined;
}
