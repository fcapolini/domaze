import * as acorn from 'acorn';
import * as dom from '../html/dom';
import { PageError } from "../html/parser";
import { ServerAttribute, ServerComment, ServerElement, ServerNode, ServerText, SourceLocation } from '../html/server-dom';
import * as rk from '../runtime/consts';
import { Global } from "../runtime/global";
import { Page, PageProps } from "../runtime/page";
import { Scope, ScopeProps } from '../runtime/scope';
import { astLocation, astObjectExpression, astProperty } from './ast/acorn-utils';
import { CompilerGlobal } from "./compiler-global";
import { CompilerScope } from "./compiler-scope";
import * as k from './consts';
import { dashToCamel, encodeEventName } from './util';

export class CompilerPage extends Page {
  scopes: CompilerScope[] = [];
  errors: PageError[] = [];
  objects!: Array<acorn.ObjectExpression>;
  ast!: acorn.ObjectExpression;

  constructor(doc: dom.Document, props: PageProps) {
    super(doc, props);
  }

  override newGlobal(): Global {
    return new CompilerGlobal(this);
  }

  override load(props: ScopeProps, p: Scope, e: dom.Element): Scope {
    props.id === 0 && this.loadProps(e as ServerElement, props);
    return super.load(props, p, e);
  }

  override newScope(props: ScopeProps, e: dom.Element): Scope {
    return new CompilerScope(this, props.id, e);
  }

  // ===========================================================================
  // logic extraction
  // ===========================================================================

  loadProps(root: ServerElement, ret: ScopeProps) {

  }

  // ===========================================================================
  // utils
  // ===========================================================================

  needsScope(e: ServerElement) {
    // `:`-prefixed directive tags
    if (e.tagName.startsWith(dom.DIRECTIVE_TAG_PREFIX)) {
      return true;
    }
    // special tagnames
    if (k.DEF_SCOPE_NAMES[e.tagName]) {
      return true;
    }
    // `:`-prefixed attributes & attribute expressions
    for (const attr of e.attributes) {
      if (
        attr.name.startsWith(k.SRC_LOGIC_ATTR_PREFIX) ||
        typeof attr.value !== 'string'
      ) {
        return true;
      }
    }
    return false;
  }

  getName(e: ServerElement) {
    const attr = e.getAttributeNode(k.SRC_NAME_ATTR) as ServerAttribute;
    if (attr) {
      const name = typeof attr.value === 'string' ? attr.value : null;
      if (/^[a-zA-z_]\w*$/.test(name ?? '')) {
        return name;
      } else {
        const err = new PageError('error', 'invalid name', attr.valueLoc);
        this.errors.push(err);
      }
    }
    return k.DEF_SCOPE_NAMES[e.tagName];
  }

  collectAttributes(scope: Scope, e: ServerElement, ret: acorn.ObjectExpression) {
    for (let i = 0; i < e.attributes.length;) {
      const a = e.attributes[i] as ServerAttribute;
      if (!k.SRC_ATTR_NAME_REGEX.test(a.name)) {
        const err = new PageError('error', 'invalid attribute name', a.loc);
        this.errors.push(err);
        i++;
        continue;
      }
      if (
        !a.name.startsWith(k.SRC_LOGIC_ATTR_PREFIX) &&
        typeof a.value === 'string'
      ) {
        i++;
        continue;
      }
      if (a.name.startsWith(k.SRC_SYS_ATTR_PREFIX)) {
        this.collectSysAttribute(scope, a, ret);
      } else if (a.name.startsWith(k.SRC_EVENT_ATTR_PREFIX)) {
        this.collectEventAttribute(a, ret);
      } else if (a.name.startsWith(k.SRC_LOGIC_ATTR_PREFIX)) {
        this.collectValueAttribute(a, ret);
      } else {
        this.collectNativeAttribute(a, ret);
      }
      e.attributes.splice(i, 1);
    }
  }

  collectSysAttribute(scope: Scope, a: ServerAttribute, ret: acorn.ObjectExpression) {
    const name = rk.RT_SYS_VALUE_PREFIX
      + a.name.substring(k.SRC_SYS_ATTR_PREFIX.length);
    switch (name) {
    case '$name':
      this.checkLiteralAttribute(a) && (scope.name = a.value as string);
      break;
    }
    const value = this.makeValue('', name, a.value, a.loc, a.valueLoc!);
    ret.properties.push(value);
  }

  checkLiteralAttribute(a: ServerAttribute): boolean {
    const ret = typeof a.value === 'string';
    if (!ret) {
      this.errors.push(new PageError(
        'error',
        `invalid ${a.name} attribute`,
        a.valueLoc
      ));
    }
    return ret;
  }

  collectValueAttribute(a: ServerAttribute, ret: acorn.ObjectExpression) {
    const name = a.name.substring(k.SRC_LOGIC_ATTR_PREFIX.length);
    const loc: SourceLocation = {
      source: a.loc.source,
      start: { ...a.loc.start },
      end: { ...a.loc.end },
      i1: a.loc.i1,
      i2: a.loc.i2,
    };
    loc.start.column += k.SRC_LOGIC_ATTR_PREFIX.length;
    const value = this.makeValue('', name, a.value, loc, a.valueLoc!);
    ret.properties.push(value);
  }

  collectNativeAttribute(a: ServerAttribute, ret: acorn.ObjectExpression) {
    const name = dashToCamel(a.name);
    const value = this.makeValue(
      rk.RT_ATTR_VALUE_PREFIX, name, a.value, a.loc, a.valueLoc!
    );
    ret.properties.push(value);
  }

  collectEventAttribute(a: ServerAttribute, ret: acorn.ObjectExpression) {
    // attribute value must be a function expression
    if (
      typeof a.value !== 'object' ||
      a.value?.type !== 'ArrowFunctionExpression'
    ) {
      this.errors.push(new PageError(
        'error', 'event listeners must be arrow functions', a.valueLoc
      ));
    }
    // make value
    const n = encodeEventName(a.name.substring(k.SRC_EVENT_ATTR_PREFIX.length));
    const value = this.makeValue(
      rk.RT_EVENT_VALUE_PREFIX, n, a.value, a.loc, a.valueLoc!
    );
    ret.properties.push(value);
  }

  collectTexts(e: ServerElement, v: acorn.ObjectExpression) {
    let count = 0;
    const f = (e: ServerElement) => {
      for (let i = 0; i < e.childNodes.length;) {
        const n = e.childNodes[i] as ServerNode;
        if (
          n.nodeType === dom.NodeType.ELEMENT &&
          !this.needsScope(n as ServerElement)
        ) {
          f(n as ServerElement);
        } else if (
          n.nodeType === dom.NodeType.TEXT &&
          typeof (n as ServerText).textContent !== 'string'
        ) {
          const name = rk.RT_TEXT_VALUE_PREFIX + count;
          const value = this.makeValue(
            '', name, (n as ServerText).textContent, n.loc, n.loc
          );
          v.properties.push(value);
          const c1 = new ServerComment(
            e.ownerDocument, rk.OUT_TEXT_MARKER1 + (count++), n.loc
          );
          e.insertBefore(c1, n);
          const c2 = new ServerComment(
            e.ownerDocument, rk.OUT_TEXT_MARKER2, n.loc
          );
          e.insertBefore(c2, (n.nextSibling as ServerNode) ?? null);
          i += 2;
        }
        i++;
      }
    };
    f(e);
  }

  makeValue(
    prefix: string,
    name: string,
    value: string | acorn.Expression | null,
    loc1: SourceLocation,
    loc2: SourceLocation
  ) {
    this.checkName(name, loc1);
    const o = astObjectExpression(loc2);
    const p = astProperty('exp', this.makeValueFunction(value, loc2), loc2);
    o.properties.push(p);
    return astProperty(prefix + name, o, loc2);
  }

  makeValueFunction(
    value: string | acorn.Expression | null,
    l: SourceLocation
  ): acorn.Expression {
    const body: acorn.BlockStatement = {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: typeof value === 'string'
            ? { type: 'Literal', value, ...astLocation(l) }
            : value,
          ...astLocation(l)
        }
      ],
      ...astLocation(l)
    };
    return {
      type: 'FunctionExpression',
      id: null,
      expression: false,
      generator: false,
      async: false,
      params: [],
      body,
      ...astLocation(l)
    };
  }

  checkName(name: string, loc: SourceLocation): boolean {
    if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)) {
      this.errors.push(new PageError(
        'error', `invalid value name "${name}"`, loc
      ));
      return false;
    }
    return true;
  }
}
