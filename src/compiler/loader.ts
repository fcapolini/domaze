import * as acorn from "acorn";
import * as dom from "../html/dom";
import { ATOMIC_TEXT_TAGS, PageError, Source } from '../html/parser';
import { ServerAttribute, ServerComment, ServerElement, ServerNode, ServerText, SourceLocation } from "../html/server-dom";
import { RT_ATTR_VAL_PREFIX, RT_CLASS_VAL_PREFIX, RT_STYLE_VAL_PREFIX, RT_TEXT_MARKER1_PREFIX, RT_TEXT_MARKER2, RT_TEXT_VAL_PREFIX } from "../runtime/const";
import { CompilerScope } from './compiler';
import * as k from "./const";

export function load(source: Source): CompilerScope {
  let id = 0;

  const error = (loc: SourceLocation, msg: string) => {
    source.errors.push(new PageError('error', msg, loc))
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

      // attributes
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
          // scope name attribute
          if (name === k.SYS_NAME_ATTR_PREFIX) {
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
          // class attribute
          if (name.startsWith(k.CLASS_ATTR_PREFIX)) {
            const key = name.substring(k.CLASS_ATTR_PREFIX.length);
            scope.values || (scope.values = {});
            scope.values[RT_CLASS_VAL_PREFIX + key] = {
              val: (attr as ServerAttribute).value,
              keyLoc: (attr as ServerAttribute).loc,
              valLoc: (attr as ServerAttribute).valueLoc
            };
            continue;
          }
          // style attribute
          if (name.startsWith(k.STYLE_ATTR_PREFIX)) {
            const key = name.substring(k.STYLE_ATTR_PREFIX.length);
            scope.values || (scope.values = {});
            scope.values[RT_STYLE_VAL_PREFIX + key] = {
              val: (attr as ServerAttribute).value,
              keyLoc: (attr as ServerAttribute).loc,
              valLoc: (attr as ServerAttribute).valueLoc
            };
            continue;
          }
          // value attribute
          scope.values || (scope.values = {});
          scope.values[name] = {
            val: (attr as ServerAttribute).value,
            keyLoc: (attr as ServerAttribute).loc,
            valLoc: (attr as ServerAttribute).valueLoc
          };
        } else if (attr.value && typeof attr.value === 'object') {
          // dynamic HTML attr
          e.removeAttribute(attr.name);
          scope.values || (scope.values = {});
          scope.values[RT_ATTR_VAL_PREFIX + attr.name] = {
            val: (attr as ServerAttribute).value,
            keyLoc: (attr as ServerAttribute).loc,
            valLoc: (attr as ServerAttribute).valueLoc
          };
        }
      }

      // texts
      const texts = lookupDynamicTexts(e);
      if (ATOMIC_TEXT_TAGS.has(e.tagName) && texts.length === 1 && texts[0].parentElement === e) {
        const text = texts[0];
        scope.values || (scope.values = {});
        scope.values[RT_TEXT_VAL_PREFIX] = {
          val: text.textContent as acorn.Expression,
          keyLoc: (text as ServerText).loc,
          valLoc: (text as ServerText).loc
        };
      } else {
        texts.forEach((text, index) => {
          scope.values || (scope.values = {});
          scope.values[RT_TEXT_VAL_PREFIX + index] = {
            val: text.textContent as acorn.Expression,
            keyLoc: (text as ServerText).loc,
            valLoc: (text as ServerText).loc
          };
          const t = text as ServerText;
          const p = t.parentElement!;
          const m1 = `${RT_TEXT_MARKER1_PREFIX}${index}`;
          const m2 = RT_TEXT_MARKER2;
          const c1 = new ServerComment(e.ownerDocument, m1, t.loc);
          const c2 = new ServerComment(e.ownerDocument, m2, t.loc);
          p.insertBefore(c1, t);
          p.insertBefore(c2, t);
          p.removeChild(t);
        });
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
  // has a name
  const defName = k.DEF_SCOPE_NAMES[e.tagName];
  if (defName) {
    if (!e.getAttribute(k.IN_VALUE_ATTR_PREFIX + 'name')) {
      e.setAttribute(k.IN_VALUE_ATTR_PREFIX + 'name', defName);
    }
    return true;
  }

  // is root
  if (!e.parentElement) {
    return true;
  }

  // has dynamic attributes
  for (const attr of (e as ServerElement).attributes) {
    if (
      attr.name.startsWith(k.IN_VALUE_ATTR_PREFIX) ||
      typeof attr.value === 'object'
    ) {
      return true;
    }
  }

  // is an "atomic text tag" and has dynamic content
  if (ATOMIC_TEXT_TAGS.has(e.tagName)) {
    const t = e.childNodes.length === 1 ? e.childNodes[0] as ServerText : null;
    if (t?.nodeType === dom.NodeType.TEXT && typeof t.textContent === 'object') {
      return true;
    }
  }

  // none of the above
  return false;
}

function lookupDynamicTexts(e: dom.Element) {
  const ret: dom.Text[] = [];

  const lookup = (e: dom.Element) => {
    for (const n of e.childNodes) {
      if (n.nodeType === dom.NodeType.ELEMENT) {
        if (!needsScope(n as dom.Element)) {
          lookup(n as dom.Element);
        }
      } else if (n.nodeType === dom.NodeType.TEXT) {
        if (typeof (n as dom.Text).textContent === 'object') {
          ret.push(n as dom.Text);
        }
      }
    }
  }
  lookup(e);

  return ret;
}
