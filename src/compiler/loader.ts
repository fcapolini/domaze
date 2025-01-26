import * as acorn from 'acorn';
import * as dom from "../html/dom";
import { Source } from '../html/parser';
import { ServerAttribute, ServerElement, SourceLocation } from "../html/server-dom";
import * as k from "./const";

const ID_RE = /^[a-zA-Z_]\w*$/;
const DEF_NAMES: any = {
  'HTML': 'page',
  'HEAD': 'head',
  'BODY': 'body',
}

export interface CompilerScope {
  id: number;
  name?: string;
  values?: CompilerValue[];
  children: CompilerScope[];
  loc: SourceLocation;
}

export interface CompilerValue {
  key: string;
  val: string | acorn.Expression | null;
}

export function load(source: Source): CompilerScope {
  let id = 0;

  const error = (n: dom.Node, msg: string) => {
    //TODO
  }

  const load = (e: ServerElement, p: CompilerScope) => {
    if (needsScope(e)) {
      const scope: CompilerScope = {
        id: id++,
        children: [],
        loc: e.loc,
      };
      e.setAttribute(k.OUT_OBJ_ID_ATTR, `${scope.id}`);
      p.children.push(scope);
      for (const attr of [...(e as ServerElement).attributes]) {
        if (attr.name.startsWith(k.IN_VALUE_ATTR_PREFIX)) {
          const name = attr.name.substring(k.IN_VALUE_ATTR_PREFIX.length);
          e.removeAttribute(attr.name);
          // system attribute 'name'
          if (name === 'name') {
            if (typeof attr.value !== 'string' || !ID_RE.test(attr.value)) {
              error(attr, 'invalid object name');
              continue;
            }
            scope.name = attr.value;
            continue;
          }
          //TODO: special prefixes, e.g. 'on-'
          if (!ID_RE.test(name)) {
            error(attr, 'invalid value name');
            continue;
          }
          // value attribute
          scope.values || (scope.values = []);
          scope.values.push({
            key: name,
            val: (attr as ServerAttribute).value,
          });
        }
      }
      p = scope;
    }
    e.childNodes.forEach(n => {
      if (n.nodeType === dom.NodeType.ELEMENT) {
        load(n as ServerElement, p);
      }
    });
  }

  const root = {
    id: id++,
    children: [],
    loc: source.doc.loc,
  };
  load(source.doc.documentElement!, root);
  return root;
}

function needsScope(e: dom.Element): boolean {
  const defName = DEF_NAMES[e.tagName];
  if (defName) {
    if (!e.getAttribute(k.IN_VALUE_ATTR_PREFIX + 'name')) {
      e.setAttribute(k.IN_VALUE_ATTR_PREFIX + 'name', defName);
    }
    return true;
  }
  if (!e.parentElement) {
    return true;
  }
  for (const attr of (e as ServerElement).attributes) {
    if (attr.name.startsWith(k.IN_VALUE_ATTR_PREFIX)) {
      return true;
    }
  }
  return false;
}
