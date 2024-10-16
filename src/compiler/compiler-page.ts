import {
  ArrayExpression, BlockStatement, Expression, ObjectExpression
} from 'acorn';
import { ELEMENT_NODE } from 'trillo/preprocessor/dom';
import * as dom from '../html/dom';
import { PageError } from '../html/parser';
import {
  ServerAttribute, ServerComment, ServerDocument, ServerElement, ServerNode,
  ServerText, SourceLocation
} from '../html/server-dom';
import * as k from '../runtime/consts';
import * as pg from '../runtime/page';
import { NodeProps, Node } from '../runtime/node';
import { ForeachNode } from '../runtime/nodes/foreach-node';
import { ValueProps, Value } from '../runtime/value';
import {
  astArrayExpression, astLiteral, astLocation, astObjectExpression, astProperty
} from './ast/acorn-utils';
import { qualifyPageIdentifiers } from './ast/qualifier';
import { resolveValueDependencies } from './ast/resolver';
import { dashToCamel, encodeEventName } from './util';
import { Global } from '../runtime/global';
import { BaseNode } from '../runtime/nodes/base-node';
import { ServerGlobal } from '../server/server-global';

export const SRC_LOGIC_ATTR_PREFIX = ':';
export const SRC_SYS_ATTR_PREFIX = '::';
export const SRC_ATTR_NAME_REGEX = /^:{0,2}[a-zA-Z_][a-zA-Z0-9_$-]*$/;

export const SRC_NAME_ATTR = SRC_SYS_ATTR_PREFIX + 'name';
export const SRC_EVENT_ATTR_PREFIX = SRC_LOGIC_ATTR_PREFIX + 'on-';

export const SRC_FOREACH_TAG = dom.DIRECTIVE_TAG_PREFIX + 'FOREACH';
export const SRC_FOREACH_ITEM_ATTR = SRC_LOGIC_ATTR_PREFIX + 'item';

export const DEF_SCOPE_NAMES: { [key: string]: string } = {
  HTML: 'page',
  HEAD: 'head',
  BODY: 'body'
};

//TODO: prevent classic functions in ${} expressions (error if there are)
export class CompilerPage extends pg.Page {
  ast!: ObjectExpression;
  scopes!: Array<Node>;
  objects!: Array<ObjectExpression>;
  errors!: PageError[];

  constructor(doc: dom.Document, props: pg.PageProps) {
    super(doc, props);
  }

  override newGlobal(): Global {
    return new ServerGlobal(this, this.props);
  }

  override load(_props: NodeProps, _p: Node, _e: dom.Element): Node {

    const load = (
      e: ServerElement, s: Node, p: ArrayExpression,
      v?: ObjectExpression
    ) => {
      if (this.needsScope(e)) {
        const l = e.loc;
        const id = this.scopes.length;
        e.setAttribute(k.OUT_ID_ATTR, `${id}`);

        const name = this.getName(e);
        if (name && s instanceof ForeachNode) {
          this.errors.push(new PageError(
            'error', 'foreach content cannot have a name', e.loc
          ));
        }

        s = this.newNode({ id }, e).linkTo(s);
        s.name = DEF_SCOPE_NAMES[e.tagName];
        this.scopes.push(s);
        const o = astObjectExpression(l);
        this.objects.push(o);

        o.properties.push(astProperty('dom', astLiteral(id, l), l));
        if (s.type) {
          o.properties.push(astProperty('type', astLiteral(s.type, l), l));
        }
        name && o.properties.push(astProperty('name', astLiteral(name, l), l));

        v = astObjectExpression(l);
        this.collectAttributes(s, e, v);
        s.type !== 'foreach' && this.collectTexts(e, v);
        v.properties.length && o.properties.push(astProperty('values', v, l));

        p.elements.push(o);
        p = astArrayExpression(l);
        o.properties.push(astProperty('children', p, l));
      }
      e.childNodes.forEach((n: dom.Node) => {
        if (n.nodeType === dom.NodeType.ELEMENT) {
          load(n as ServerElement, s, p, v);
        }
      });
      return s;
    };

    const doc = this.doc as ServerDocument;
    this.ast = astObjectExpression(doc.loc);
    const pp = astArrayExpression(doc.loc);
    this.ast.properties.push(astProperty('root', pp, doc.loc));
    this.scopes = [];
    this.objects = [];
    this.errors = [];
    const ret = load(doc.documentElement! as ServerElement, this.global, pp);
    !this.hasErrors() && qualifyPageIdentifiers(this);
    !this.hasErrors() && resolveValueDependencies(this);
    return ret;
  }

  override newNode(props: NodeProps, e: dom.Element): Node {
    if (e.tagName === SRC_FOREACH_TAG) {
      return this.newForeachNode(props, e);
    }
    if (e.tagName.startsWith(dom.DIRECTIVE_TAG_PREFIX)) {
      this.errors.push(new PageError(
        'error', 'unknown directive ' + e.tagName, e.loc as SourceLocation
      ));
    }
    return new BaseNode(this, props, e, this.global);
  }

  protected newForeachNode(props: NodeProps, e: dom.Element): Node {
    const l = e.loc as SourceLocation;
    e.tagName = 'TEMPLATE';
    const ret = new ForeachNode(this, props, e, this.global);
    const ee = [...e.childNodes].filter(n => n.nodeType === ELEMENT_NODE);
    if (ee.length !== 1) {
      this.errors.push(new PageError(
        'error', '<:foreach> should contain a single element', l
      ));
    }
    const nn = [...e.childNodes].filter(n => n.nodeType !== ELEMENT_NODE);
    while (nn.length) {
      nn.pop()?.unlink();
    }
    const child = ee[0] as ServerElement;
    // ensure child element has `:item` attribute and its own scope
    if (child && !child.getAttributeNode(SRC_FOREACH_ITEM_ATTR)) {
      child.setAttribute(SRC_FOREACH_ITEM_ATTR, '');
      const a = child.getAttributeNode(SRC_FOREACH_ITEM_ATTR)!;
      a.loc = a.valueLoc = child.loc;
    }
    if (!(e as ServerElement).getAttributeNode(SRC_FOREACH_ITEM_ATTR)) {
      this.errors.push(new PageError(
        'error', `missing ${SRC_FOREACH_ITEM_ATTR} attribute in <:foreach>`, l
      ));
    }
    return ret;
  }

  override newValue(scope: Node, name: string, props: ValueProps): Value {
    return new Value(this, scope, props);
  }

  hasErrors() {
    for (const e of this.errors) {
      if (e.type === 'error') {
        return true;
      }
    }
    return false;
  }

  needsScope(e: ServerElement) {
    // `:`-prefixed directive tags
    if (e.tagName.startsWith(dom.DIRECTIVE_TAG_PREFIX)) {
      return true;
    }
    // special tagnames
    if (DEF_SCOPE_NAMES[e.tagName]) {
      return true;
    }
    // `:`-prefixed attributes & attribute expressions
    for (const attr of e.attributes) {
      if (
        attr.name.startsWith(SRC_LOGIC_ATTR_PREFIX) ||
        typeof attr.value !== 'string'
      ) {
        return true;
      }
    }
    return false;
  }

  getName(e: ServerElement) {
    const attr = e.getAttributeNode(SRC_NAME_ATTR) as ServerAttribute;
    if (attr) {
      const name = typeof attr.value === 'string' ? attr.value : null;
      if (/^[a-zA-z_]\w*$/.test(name ?? '')) {
        return name;
      } else {
        const err = new PageError('error', 'invalid name', attr.valueLoc);
        this.errors.push(err);
      }
    }
    return DEF_SCOPE_NAMES[e.tagName];
  }

  collectAttributes(scope: Node, e: ServerElement, ret: ObjectExpression) {
    for (let i = 0; i < e.attributes.length;) {
      const a = e.attributes[i] as ServerAttribute;
      if (!SRC_ATTR_NAME_REGEX.test(a.name)) {
        const err = new PageError('error', 'invalid attribute name', a.loc);
        this.errors.push(err);
        i++;
        continue;
      }
      if (
        !a.name.startsWith(SRC_LOGIC_ATTR_PREFIX) &&
        typeof a.value === 'string'
      ) {
        i++;
        continue;
      }
      if (a.name.startsWith(SRC_SYS_ATTR_PREFIX)) {
        this.collectSysAttribute(scope, a, ret);
      } else if (a.name.startsWith(SRC_EVENT_ATTR_PREFIX)) {
        this.collectEventAttribute(a, ret);
      } else if (a.name.startsWith(SRC_LOGIC_ATTR_PREFIX)) {
        this.collectValueAttribute(a, ret);
      } else {
        this.collectNativeAttribute(a, ret);
      }
      e.attributes.splice(i, 1);
    }
  }

  collectSysAttribute(scope: Node, a: ServerAttribute, ret: ObjectExpression) {
    const name = k.RT_SYS_VALUE_PREFIX
      + a.name.substring(SRC_SYS_ATTR_PREFIX.length);
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

  collectValueAttribute(a: ServerAttribute, ret: ObjectExpression) {
    const name = a.name.substring(SRC_LOGIC_ATTR_PREFIX.length);
    const loc: SourceLocation = {
      source: a.loc.source,
      start: { ...a.loc.start },
      end: { ...a.loc.end },
      i1: a.loc.i1,
      i2: a.loc.i2,
    };
    loc.start.column += SRC_LOGIC_ATTR_PREFIX.length;
    const value = this.makeValue('', name, a.value, loc, a.valueLoc!);
    ret.properties.push(value);
  }

  collectNativeAttribute(a: ServerAttribute, ret: ObjectExpression) {
    const name = dashToCamel(a.name);
    const value = this.makeValue(
      k.RT_ATTR_VALUE_PREFIX, name, a.value, a.loc, a.valueLoc!
    );
    ret.properties.push(value);
  }

  collectEventAttribute(a: ServerAttribute, ret: ObjectExpression) {
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
    const n = encodeEventName(a.name.substring(SRC_EVENT_ATTR_PREFIX.length));
    const value = this.makeValue(
      k.RT_EVENT_VALUE_PREFIX, n, a.value, a.loc, a.valueLoc!
    );
    ret.properties.push(value);
  }

  collectTexts(e: ServerElement, v: ObjectExpression) {
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
          const name = k.RT_TEXT_VALUE_PREFIX + count;
          const value = this.makeValue(
            '', name, (n as ServerText).textContent, n.loc, n.loc
          );
          v.properties.push(value);
          const c1 = new ServerComment(
            e.ownerDocument, k.OUT_TEXT_MARKER1 + (count++), n.loc
          );
          e.insertBefore(c1, n);
          const c2 = new ServerComment(
            e.ownerDocument, k.OUT_TEXT_MARKER2, n.loc
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
    value: string | Expression | null,
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
    value: string | Expression | null,
    l: SourceLocation
  ): Expression {
    const body: BlockStatement = {
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
