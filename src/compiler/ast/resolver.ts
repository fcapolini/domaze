import estraverse from 'estraverse';
import {
  ArrayExpression, Expression, FunctionExpression, Literal,
  MemberExpression, Node, ObjectExpression, Property
} from 'estree';
import { PageError } from '../../html/parser';
import { RT_PARENT_KEY, RT_VALUE_KEY } from '../../runtime/consts';
import { CompilerPage } from '../compiler-page';
import { Stack } from '../util';
import { getProperty, getPropertyName, Path, PathItem } from './estree-utils';
import { ArrowFunctionExpression } from 'acorn';

interface Target {
  obj?: ObjectExpression;
  type: 'scope' | 'value' | 'global';
}

/**
 * Resolves value dependencies and adds dependency functions to them.
 * See page/props.ts -> ValueDep
 * @param page
 */
export function resolveValueDependencies(page: CompilerPage): void {
  if (page.errors.length > 0) {
    return;
  }

  function makePath(exp: MemberExpression) {
    const p = new Path();
    function f(e: MemberExpression) {
      if (e.object.type === 'MemberExpression') {
        f(e.object);
      } else if (e.object.type === 'ThisExpression') {
        p.push({ name: 'this', node: e });
      }
      const name = getPropertyName(e);
      p.length && p.push({ name: name ?? '', node: e });
    }
    f(exp);
    return p.length > 1 && p[0].name === 'this' ? p : null;
  }

  function getParentScope(obj: ObjectExpression): ObjectExpression | null {
    const scopeId = (getProperty(obj, 'dom') as Literal).value as number;
    const scope = page.scopes[scopeId];
    const parent = scope.parent;
    const parentId = parent?.id;
    const ret = parentId != null && parentId >= 0
      ? page.objects[parentId] as ObjectExpression
      : null;
    return ret;
  }

  function resolveName(
    obj: ObjectExpression | null, item: PathItem
  ): Target | null {
    while (obj) {
      // 1. system values
      switch (item.name) {
      case RT_PARENT_KEY:
        obj = getParentScope(obj);
        if (obj) {
          return { obj, type: 'scope' };
        }
        return null;
      }
      // 2. values
      const values = getProperty(obj, 'values') as ObjectExpression;
      const value = values ? getProperty(values, item.name) : null;
      if (value) {
        return {
          obj: value as ObjectExpression,
          type: 'value'
        };
      }
      // 3. named sub scopes
      const children = getProperty(obj, 'children') as ArrayExpression;
      for (const child of children?.elements ?? []) {
        const p = getProperty(child as ObjectExpression, 'name');
        if ((p as Literal)?.value === item.name) {
          return {
            obj: child as ObjectExpression,
            type: 'scope'
          };
        }
      }
      // 4. ascend
      const isolated = getProperty(obj, 'isolated');
      if (isolated) {
        return null;
      }
      obj = getParentScope(obj);
    }
    // 5. global
    if (Reflect.ownKeys(page.global.values).includes(item.name)) {
      return {
        type: 'global'
      };
    }
    return null;
  }

  function refinePath(
    stack: Stack<ObjectExpression>,
    name: string,
    path: Path
  ) {
    let target: Target = {
      obj: stack.peek()!,
      type: 'scope'
    };
    let i = 1;
    for (; target.obj && i < path.length; i++) {
      const t = resolveName(target.obj, path[i]);
      if (t?.type === 'scope') {
        target = t;
      } else if (t?.type === 'value') {
        break;
      } else {
        while (path.length > (i + 1)) {
          path.pop();
        }
        if (t?.type === 'global') {
          path.okDependency = false;
          break;
        }
        page.errors.push(new PageError(
          'error',
          `invalid reference: ${path.toString().replace(/^this\./, '')}`,
          path[i].node.loc
        ));
        break;
      }
    }
    while ((i + 1) < path.length) {
      path.pop();
    }
  }

  function removeSpuriousPaths(paths: Path[]) {
    for (let i = 0; i < paths.length;) {
      const path = paths[i];
      if (
        !path.okDependency ||
        path.length < 2 ||
        (path.length > 0 && path[0].name !== 'this')
      ) {
        paths.splice(i, 1);
        continue;
      }
      i++;
    }
  }

  function makeValueDep(path: Path): FunctionExpression {
    const name = path.pop()!.name;
    path.shift(); // remove initial 'this' item
    path.push({ name: RT_VALUE_KEY, node: {} as Node });
    let callee: Expression = { type: 'ThisExpression' };
    path.forEach(item => {
      callee = {
        type: 'MemberExpression',
        object: callee,
        property: { type: 'Identifier', name: item.name },
        computed: false,
        optional: false
      };
    });
    return {
      type: 'FunctionExpression',
      params: [],
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: 'CallExpression',
              callee: callee,
              arguments: [{ type: 'Literal', value: name }],
              optional: false
            }
          }
        ]
      },
      generator: false,
      async: false
    };
  }

  function isInFunctionBody(nodeStack: Stack<Node>): boolean {
    for (let i = -1; (nodeStack.length + i) >= 2; i--) {
      if (
        nodeStack.peek(i - 1)?.type === 'ArrowFunctionExpression' &&
        nodeStack.peek(i) === (nodeStack.peek(i - 1) as ArrowFunctionExpression)?.body
      ) {
        // in arrow function expression body
        return true;
      }
      if (
        nodeStack.peek(i - 1)?.type === 'FunctionExpression' &&
        nodeStack.peek(i)?.type === 'BlockStatement'
      ) {
        // in classic function expression body
        return true;
      }
      if (
        nodeStack.peek(i - 1)?.type === 'FunctionDeclaration' &&
        nodeStack.peek(i)?.type === 'BlockStatement'
      ) {
        // in classic function declaration body
        return true;
      }
    }
    return false;
  }

  function makeValueDeps(
    scopeStack: Stack<ObjectExpression>,
    name: string,
    exp: FunctionExpression
  ): Property | null {
    // 1. collect dependencies
    const paths = new Array<Path>();
    const stack = new Stack<Node>();
    estraverse.traverse(exp as Node, {
      enter(node) {
        stack.push(node);
        if (node.type !== 'MemberExpression') {
          return;
        }
        const path = makePath(node);
        if (!path) {
          return;
        }
        for (const other of paths) {
          if (path.startsWith(other)) {
            for (let i = other.length; i < path.length; i++) {
              other.push(path[i]);
            }
            return;
          }
        }
        if (isInFunctionBody(stack)) {
          return;
        }
        paths.push(path);
      },
      leave() {
        stack.pop();
      }
    });
    // 2. refine dependencies
    removeSpuriousPaths(paths);
    paths.forEach(path => refinePath(scopeStack, name, path));
    removeSpuriousPaths(paths);
    // 3. remove duplicates
    const map = new Map<string, Path>();
    paths.forEach(path => map.set(path.toString(), path));
    if (map.size < 1) {
      return null;
    }
    // 4. return dependency functions
    const elements: Expression[] = [];
    map.forEach(path => {
      elements.push(makeValueDep(path));
    });
    return {
      type: 'Property',
      key: { type: 'Identifier', name: 'deps' },
      value: {
        type: 'ArrayExpression',
        elements
      },
      kind: 'init',
      computed: false,
      method: false,
      shorthand: false
    };
  }

  function resolveScope(scopeStack: Stack<ObjectExpression>) {
    const scope = scopeStack.peek()!;
    const values = getProperty(scope, 'values') as ObjectExpression;
    values?.properties.forEach(p => {
      if (p.type === 'Property' && p.key.type === 'Identifier') {
        const value = p.value as ObjectExpression;
        const exp = getProperty(value, 'exp') as FunctionExpression;
        const deps = makeValueDeps(scopeStack, p.key.name, exp);
        deps && value.properties.push(deps);
      }
    });
    const children = getProperty(scope, 'children') as ArrayExpression;
    children?.elements.forEach(e => {
      resolveScope(new Stack(...scopeStack, e as ObjectExpression));
    });
  }

  const props = page.ast as ObjectExpression;
  const rootScopes = getProperty(props, 'root') as ArrayExpression;
  const rootScope = rootScopes.elements[0] as ObjectExpression;
  resolveScope(new Stack(rootScope));
}
