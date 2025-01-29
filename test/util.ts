import * as acorn from 'acorn';
import estraverse from 'estraverse';
import { CompilerScope, CompilerValue } from '../src/compiler/compiler';
import { Scope } from '../src/runtime/scope';

export function cleanupScopes(scope: CompilerScope) {
  const cleanupExpression = (exp: acorn.Node) => {
    return estraverse.replace(exp as any, {
      enter: (node) => {
        delete (node as any).start;
        delete (node as any).end;
        delete (node as any).loc;
      }
    });
  }
  const cleanupValue = (value: CompilerValue) => {
    delete (value as any).keyLoc;
    delete (value as any).valLoc;
    if (typeof value.val === 'object') {
      value.val = cleanupExpression(value.val as acorn.Node) as any;
    }
  }
  scope.name && cleanupValue(scope.name);
  scope.values && Object.keys(scope.values).forEach((v) =>
    cleanupValue(scope.values![v])
  );
  delete (scope as any).parent;
  delete (scope as any).loc;
  scope.children.forEach(s => cleanupScopes(s));
  return scope;
};

export function dumpScopes(scope: Scope, tab = '') {
  console.log(`${tab}${scope.__props.__id} ${scope.__view?.tagName}`);
  scope.__children.forEach(child => dumpScopes(child, tab + '\t'));
}
