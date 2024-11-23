import { Context, FOREACH, Scope } from '../src/core';

export function traverseScopeTree(
  p: Scope,
  cb: (scope: Scope, level: number) => void,
  level = 0
) {
  cb(p, level);
  p.children.forEach((child) => traverseScopeTree(child, cb, level + 1));
}

export function ownValue(scope: Scope, name: string): any {
  const value = scope.values[name];
  return value?.get();
}

export function dumpScopes(ctx: Context): string[] {
  const dump = new Array<string>();
  traverseScopeTree(
    ctx.root,
    (scope, level) =>
      level &&
      dump.push(
        '  '.repeat(level - 1)
        + `${scope.props.type ?? 'scope'} `
        + `${ownValue(scope, FOREACH.CLONE_NR) ?? null} `
        + JSON.stringify(ownValue(scope, FOREACH.DEF_DATA) ?? null)
      )
  );
  return dump;
}
