import * as acorn from 'acorn';
import * as dom from '../html/dom';
import { PageError } from "../html/parser";
import { ServerAttribute, ServerComment, ServerElement, ServerNode, ServerText, SourceLocation } from '../html/server-dom';
import * as rk from '../runtime/consts';
import { Global } from "../runtime/global";
import { Page, PageProps } from "../runtime/page";
import { Node, NodeProps } from '../runtime/node';
import { astLocation, astObjectExpression, astProperty } from './ast/acorn-utils';
import { CompilerGlobal } from "./compiler-global";
import { CompilerNode } from "./compiler-node";
import * as ck from './consts';
import { PageWrapper, NodeWrapper } from './props-wrappers';
import { dashToCamel, encodeEventName } from './util';

export class CompilerPage extends Page {
  errors: PageError[] = [];
  nodes: Node[] = [];
  nodeCount!: number;
  objects!: Array<acorn.ObjectExpression>;
  ast!: acorn.ObjectExpression;

  constructor(doc: dom.Document, props: PageProps) {
    super(doc, props);
  }

  override newGlobal(): Global {
    return new CompilerGlobal(this);
  }

  override load(props: NodeProps, p: Node, e: dom.Element): Node {
    const page = new PageWrapper();
    const counter = [0];
    props.id === 0 && this.loadProps(e as ServerElement, page.global, counter);
    this.nodeCount = counter[0];
    //TODO: use page
    return super.load(props, p, e);
  }

  override newNode(props: NodeProps, e: dom.Element): Node {
    return new CompilerNode(this, props.id, e);
  }

  // ===========================================================================
  // logic extraction
  // ===========================================================================

  loadProps(e: ServerElement, p: NodeWrapper, counter: number[]) {
    if (this.needsNode(e)) {
      const id = counter[0]++;
      p = this.loadNodeProps(id, e, p);
    }
    e.childNodes.forEach(n => {
      if (n.nodeType === dom.NodeType.ELEMENT) {
        this.loadProps(n as ServerElement, p, counter);
      }
    });
  }

  loadNodeProps(id: number, e: ServerElement, p: NodeWrapper): NodeWrapper {
    e.setAttribute(rk.OUT_ID_ATTR, `${id}`);

    const name = this.getName(e);
    if (name && p.type === 'foreach') {
      this.errors.push(new PageError(
        'error', p.type + ' content cannot have a name', e.loc
      ));
    }

    p = new NodeWrapper(id, p);
    p.name = name ?? ck.DEF_NODE_NAMES[e.tagName];

    return p;
  }

  // ===========================================================================
  // utils
  // ===========================================================================

  needsNode(e: ServerElement) {
    // `:`-prefixed directive tags
    if (e.tagName.startsWith(dom.DIRECTIVE_TAG_PREFIX)) {
      return true;
    }
    // special tagnames
    if (ck.DEF_NODE_NAMES[e.tagName]) {
      return true;
    }
    // `:`-prefixed attributes & attribute expressions
    for (const attr of e.attributes) {
      if (
        attr.name.startsWith(ck.SRC_LOGIC_ATTR_PREFIX) ||
        typeof attr.value !== 'string'
      ) {
        return true;
      }
    }
    return false;
  }

  getName(e: ServerElement) {
    const attr = e.getAttributeNode(ck.SRC_NAME_ATTR) as ServerAttribute;
    if (attr) {
      const name = typeof attr.value === 'string' ? attr.value : null;
      if (/^[a-zA-z_]\w*$/.test(name ?? '')) {
        return name;
      } else {
        const err = new PageError('error', 'invalid name', attr.valueLoc);
        this.errors.push(err);
      }
    }
    return ck.DEF_NODE_NAMES[e.tagName];
  }

  collectAttributes(node: Node, e: ServerElement, ret: acorn.ObjectExpression) {
    for (let i = 0; i < e.attributes.length;) {
      const a = e.attributes[i] as ServerAttribute;
      if (!ck.SRC_ATTR_NAME_REGEX.test(a.name)) {
        const err = new PageError('error', 'invalid attribute name', a.loc);
        this.errors.push(err);
        i++;
        continue;
      }
      if (
        !a.name.startsWith(ck.SRC_LOGIC_ATTR_PREFIX) &&
        typeof a.value === 'string'
      ) {
        i++;
        continue;
      }
      if (a.name.startsWith(ck.SRC_SYS_ATTR_PREFIX)) {
        this.collectSysAttribute(node, a, ret);
      } else if (a.name.startsWith(ck.SRC_EVENT_ATTR_PREFIX)) {
        this.collectEventAttribute(a, ret);
      } else if (a.name.startsWith(ck.SRC_LOGIC_ATTR_PREFIX)) {
        this.collectValueAttribute(a, ret);
      } else {
        this.collectNativeAttribute(a, ret);
      }
      e.attributes.splice(i, 1);
    }
  }

  collectSysAttribute(node: Node, a: ServerAttribute, ret: acorn.ObjectExpression) {
    const name = rk.RT_SYS_VALUE_PREFIX
      + a.name.substring(ck.SRC_SYS_ATTR_PREFIX.length);
    switch (name) {
    case '$name':
      this.checkLiteralAttribute(a) && (node.name = a.value as string);
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
    const name = a.name.substring(ck.SRC_LOGIC_ATTR_PREFIX.length);
    const loc: SourceLocation = {
      source: a.loc.source,
      start: { ...a.loc.start },
      end: { ...a.loc.end },
      i1: a.loc.i1,
      i2: a.loc.i2,
    };
    loc.start.column += ck.SRC_LOGIC_ATTR_PREFIX.length;
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
    const n = encodeEventName(a.name.substring(ck.SRC_EVENT_ATTR_PREFIX.length));
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
          !this.needsNode(n as ServerElement)
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
