import * as ast from 'acorn';
import { SourceLocation } from 'acorn';
import { generate } from 'escodegen';
import estraverse from 'estraverse';
import * as es from 'estree';
import { PageError } from '../html/parser';
import { RT_PARENT_KEY, RT_VALUE_KEY } from '../runtime/consts';
import { astIdentifier, astLiteral } from './ast/acorn-utils';
import { CompilerGlobalNode, CompilerNode, CompilerValue } from './compiler';
import { inFunctionBody } from './qualifier';

export function generateDeps(
  value: CompilerValue,
  exp: es.Node
): ast.Expression[] | undefined  {
  const ret: ast.Expression[] = [];
  const paths = new Set<string>();

  const stack: es.Node[] = [];
  estraverse.replace(exp, {
    enter: (n) => {
      stack.push(n);
      if (n.type === 'ThisExpression') {
        let me: es.Node | null = null;
        for (let i = stack.length - 2; i >= 0; i--) {
          stack[i].type === 'MemberExpression' && (me = stack[i]);
        }
        const path = me ? generate(me) : null;
        if (!path || paths.has(path)) {
          return;
        }
        if (!inFunctionBody(stack)) {
          const dep = makeDep(value, path, me!.loc!);
          dep && ret.push(dep);
        }
      }
    },

    leave: () => {
      stack.pop();
    },
  });

  return ret.length ? ret : undefined;
}

type PathItem = { key: string, type: 'this' | 'id' | 'literal' };

function makeDep(
  value: CompilerValue, path: string, l: SourceLocation
): ast.FunctionExpression | null {
  const prog = ast.parse(path, { ecmaVersion: 'latest' }) as ast.Program;
  const stmt = prog.body[0] as ast.ExpressionStatement;
  const exp = stmt.expression as ast.MemberExpression;
  //
  // build dependency path
  //
  const items: PathItem[] = [];
  let valid = true;
  estraverse.traverse(exp as es.Node, {
    enter: (n) => {
      if (n.type === 'ThisExpression') {
        valid &&= (items.length === 0);
        items.push({ key: 'this', type: 'this' });
      } else if (n.type === 'Identifier') {
        valid &&= (items.length > 0);
        items.push({ key: n.name, type: 'id' });
      } else if (n.type === 'Literal' && typeof n.value === 'string') {
        valid &&= (items.length > 0);
        items.push({ key: n.value, type: 'literal' });
      } else if (n.type !== 'MemberExpression') {
        valid = false;
      }
    }
  });
  if (!valid || items.length < 2) {
    return null;
  }
  const res = refinePath(value, items);
  switch (res) {
  case 'ignore':
    return null;
  case 'error':
    value.node.page.errors.push(new PageError(
      'error',
      'invalid reference: ' + path.replace(/^this\./, ''),
      l
    ));
    return null;
  }
  //
  // build reference chain
  //
  const arg = items.pop()!;
  items.push({ key: RT_VALUE_KEY, type: 'id' })
  let ref: ast.Expression = { type: 'ThisExpression', ...loc(exp) };
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const property = item.type === 'id'
      ? astIdentifier(item.key, value.node.dom.loc)
      : astLiteral(item.key, value.node.dom.loc);
    ref = {
      type: 'MemberExpression',
      object: ref,
      property,
      computed: item.type === 'literal',
      optional: false,
      ...loc(exp)
    }
  }
  //
  // build dependency function
  //
  const fun: ast.FunctionExpression = {
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
        argument: {
          type: 'CallExpression',
          callee: ref,
          arguments: [{
            type: 'Literal',
            value: arg.key,
            ...loc(exp)
          }],
          optional: false,
          ...loc(exp)
        },
        ...loc(exp)
      }],
      ...loc(exp)
    },
    ...loc(exp)
  }
  return fun;
}

function refinePath(
  value: CompilerValue, items: PathItem[]
): 'ok' | 'ignore' | 'error' {
  let target: CompilerNode | undefined = value.node;
  for (let i = 0; target && i < items.length; i++) {
    if (items[i].type === 'id' || items[i].type === 'literal') {
      const t = lookupTarget(items[i].key, target);
      if (t && t instanceof CompilerValue) {
        items.splice(i + 1);
        return t.node instanceof CompilerGlobalNode ? 'ignore' : 'ok';
      }
      if (!t || !(t instanceof CompilerNode)) {
        return 'error';
      }
      target = t;
    }
  }
  return 'error';
}

function lookupTarget(
  key: string, node: CompilerNode
): CompilerNode | CompilerValue | undefined {
  let ret: CompilerNode | CompilerValue | undefined;
  if (key === RT_PARENT_KEY) {
    return node.parent;
  }
  ret ??= node.getValue(key);
  ret ??= node.getChild(key);
  node.parent && (ret ??= lookupTarget(key, node.parent));
  return ret;
}

function loc(node: ast.Node) {
  return {
    start: node.start,
    range: node.range,
    end: node.end,
    loc: node.loc
  };
}
