import * as ast from 'acorn';
import { CompilerNode } from './compiler';

export function generateDeps(
  node: CompilerNode,
  paths: string[]
): ast.Expression[]  {
  const ret: ast.Expression[] = [];

  return ret;
}
