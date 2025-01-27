import * as dom from "../html/dom";
import { PageError, Source } from '../html/parser';
import { ServerAttribute, ServerElement, ServerNode, SourceLocation } from "../html/server-dom";
import { CompilerScope } from './compiler';
import * as k from "./const";

export function load(source: Source): CompilerScope {
  let id = 0;

  const error = (loc: SourceLocation, msg: string) => {
    source.errors.push(new PageError('error', msg, loc))
    //TODO
  }

  const load = (e: ServerElement, p: CompilerScope) => {
    if (needsScope(e)) {
      const scope: CompilerScope = {
        parent: p,
        id: id++,
        children: [],
        loc: e.loc,
      };
      e.setAttribute(k.OUT_OBJ_ID_ATTR, `${scope.id}`);
      p.children.push(scope);
      for (const a of [...(e as ServerElement).attributes]) {
        const attr = a as ServerAttribute;
        if (attr.name.startsWith(k.IN_VALUE_ATTR_PREFIX)) {
          const name = attr.name.substring(k.IN_VALUE_ATTR_PREFIX.length);
          e.removeAttribute(attr.name);
          // test attributes
          if (name.startsWith(k.TEST_ATTR)) {
            handleTestAttr(scope, name);
            continue;
          }
          // system attribute 'name'
          if (name === 'name') {
            if (typeof attr.value !== 'string' || !k.ID_RE.test(attr.value)) {
              error(attr.valueLoc ?? attr.loc, 'invalid name');
              continue;
            }
            scope.name = {
              val: attr.value,
              keyLoc: attr.loc,
              valLoc: attr.valueLoc,
            }
            continue;
          }
          //TODO: special prefixes, e.g. 'on-'
          if (!k.ID_RE.test(name)) {
            error(attr.loc, 'invalid value name');
            continue;
          }
          // value attribute
          scope.values || (scope.values = {});
          scope.values[name] = {
            val: (attr as ServerAttribute).value,
            keyLoc: (attr as ServerAttribute).loc,
            valLoc: (attr as ServerAttribute).valueLoc
          };
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

function handleTestAttr(scope: CompilerScope, name: string) {
  if (name === k.TEST_CLOSED_ATTR) {
    scope.closed = true;
    return;
  }
}

function needsScope(e: dom.Element): boolean {
  const defName = k.DEF_SCOPE_NAMES[e.tagName];
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
