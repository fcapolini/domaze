import * as acorn from 'acorn';
import {
  Attribute, Comment,
  DIRECTIVE_TAG_PREFIX,
  Document,
  Element, Node, NodeType,
  Text
} from './dom';

export const VOID_ELEMENTS = new Set([
  'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT',
  'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR',
  'COMMAND', 'KEYGEN', 'MENUITEM'
]);

export interface SourceLocation extends acorn.SourceLocation {
  i1: number;
  i2: number;
}

export abstract class ServerNode implements Node {
  ownerDocument: ServerDocument | null;
  parentElement: ServerElement | null;
  nodeType: number;
  loc: SourceLocation;

  constructor(
    doc: ServerDocument | null,
    type: number,
    loc: SourceLocation
  ) {
    this.ownerDocument = doc;
    this.parentElement = null;
    this.nodeType = type;
    this.loc = loc;
  }

  unlink(): this {
    this.parentElement?.removeChild(this);
    return this;
  }

  get nextSibling(): Node | null {
    const nn = this.parentElement?.childNodes;
    const i = nn ? nn.indexOf(this) : -1;
    if (i >= 0 && (i + 1) < (nn ? nn.length : 0)) {
      return nn![i + 1];
    }
    return null;
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      loc: this.ownerDocument?.jsonLoc ? this.loc : null
    };
  }

  toString(): string {
    const sb = new Array<string>();
    this.toMarkup(sb);
    return sb.join('');
  }

  addEventListener(_: string, __: unknown): void {}
  removeEventListener(_: string, __: unknown): void {}

  abstract toMarkup(ret: string[]): void;
  abstract clone(doc: ServerDocument | null, parent: ServerElement | null): ServerNode;
}

export class ServerText extends ServerNode implements Text {
  textContent: string | acorn.Expression;
  escaping: boolean;

  constructor (
    doc: ServerDocument | null,
    value: string | acorn.Expression,
    loc: SourceLocation,
    escaping = true
  ) {
    super(doc, NodeType.TEXT, loc);
    this.textContent = typeof value === 'string' && escaping
      ? unescapeText(value)
      : value;
    this.escaping = escaping;
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      value: this.textContent,
      loc: this.ownerDocument?.jsonLoc ? this.loc : null
    };
  }

  toMarkup(ret: string[]): void {
    if (typeof this.textContent === 'string') {
      ret.push(this.escaping
        ? escape(this.textContent, '<>')
        : this.textContent);
    }
  }

  override clone(doc: ServerDocument | null, parent: ServerElement | null): ServerText {
    const ret = new ServerText(doc, this.textContent, this.loc, this.escaping);
    parent?.appendChild(ret);
    return ret;
  }
}

export class ServerComment extends ServerNode implements Comment {
  textContent: string;

  constructor(
    doc: ServerDocument | null,
    value: string,
    loc: SourceLocation
  ) {
    super(doc, NodeType.COMMENT, loc);
    this.textContent = value;
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      value: this.textContent,
      loc: this.ownerDocument?.jsonLoc ? this.loc : null
    };
  }

  toMarkup(ret: string[]): void {
    ret.push('<!--');
    ret.push(this.textContent);
    ret.push('-->');
  }

  override clone(doc: ServerDocument | null, parent: ServerElement | null): ServerComment {
    const ret = new ServerComment(doc, this.textContent, this.loc);
    parent?.appendChild(ret);
    return ret;
  }
}

export class ServerAttribute extends ServerNode implements Attribute {
  name: string;
  value: string | acorn.Expression | null;
  valueLoc?: SourceLocation;
  quote?: string;

  constructor(
    doc: ServerDocument | null,
    parent: ServerElement | null,
    name: string,
    value: string | acorn.Expression | null,
    loc: SourceLocation
  ) {
    super(doc, NodeType.ATTRIBUTE, loc);
    this.name = name;
    this.value = value;
    parent && parent.attributes.push(this);
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      name: this.name,
      value: this.value,
      quote: this.quote,
      loc: this.ownerDocument?.jsonLoc ? this.loc : null
    };
  }

  toMarkup(ret: string[]): void {
    if (this.value !== null && typeof this.value !== 'string') {
      return;
    }
    const q = this.quote ?? '"';
    ret.push(' ');
    ret.push(this.name);
    if (this.value === null) {
      return;
    }
    ret.push('=');
    ret.push(q);
    ret.push(escape(this.value as string, '&<' + q));
    ret.push(q);
  }

  override clone(doc: ServerDocument | null, parent: ServerElement | null): ServerAttribute {
    const ret = new ServerAttribute(doc, parent, this.name, this.value, this.loc);
    ret.valueLoc = this.valueLoc;
    ret.quote = this.quote;
    return ret;
  }
}

export class ServerElement extends ServerNode implements Element {
  tagName: string;
  childNodes: Node[];
  attributes: Attribute[];

  constructor(
    doc: ServerDocument | null,
    name: string,
    loc: SourceLocation
  ) {
    super(doc, NodeType.ELEMENT, loc);
    this.tagName = name.toUpperCase();
    this.childNodes = [];
    this.attributes = [];
  }

  appendChild(n: Node): Node {
    return this.insertBefore(n, null);
  }

  insertBefore(n: Node, ref: Node | null): Node {
    this.removeChild(n);
    let i = ref ? this.childNodes.indexOf(ref) : -1;
    i = i < 0 ? this.childNodes.length : i;
    this.childNodes.splice(i, 0, n);
    n.parentElement = this;
    return n;
  }

  removeChild(n: Node) {
    const i = this.childNodes.indexOf(n);
    i >= 0 && this.childNodes.splice(i, 1);
    n.parentElement = null;
  }

  getAttributeNames(): Set<string> {
    const ret = new Set<string>();
    this.attributes.forEach(a => ret.add(a.name));
    return ret;
  }

  getAttribute(name: string): string | null {
    let ret: string | null = null;
    for (const a of this.attributes) {
      if (a.name === name) {
        if (typeof a.value === 'string') {
          ret = a.value;
        }
        break;
      }
    }
    return ret;
  }

  getAttributeNode(name: string): Attribute | null {
    for (const a of this.attributes) {
      if (a.name === name) {
        return a;
      }
    }
    return null;
  }

  delAttributeNode(attr: Attribute) {
    const i = this.attributes.indexOf(attr);
    i >= 0 && this.attributes.splice(i, 1);
  }

  setAttribute(name: string, value: string | null) {
    let a = this.getAttributeNode(name);
    if (a) {
      a.value = value;
      return;
    }
    a = new ServerAttribute(this.ownerDocument, this, name, value, this.loc);
  }

  removeAttribute(name: string) {
    const attr = this.getAttributeNode(name);
    attr && this.delAttributeNode(attr);
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      name: this.tagName,
      attributes: this.attributes,
      children: this.childNodes,
      loc: this.ownerDocument?.jsonLoc ? this.loc : null
    };
  }

  toMarkup(ret: string[]): void {
    // if (this.tagName.startsWith(DIRECTIVE_TAG_PREFIX)) {
    //   return;
    // }
    // ret.push('<');
    // ret.push(this.tagName.toLowerCase());
    // this.attributes.forEach(a => (a as ServerAttribute).toMarkup(ret));
    // ret.push('>');
    // if (VOID_ELEMENTS.has(this.tagName)) {
    //   return;
    // }
    // this.childNodes.forEach(n => (n as ServerNode).toMarkup(ret));
    // ret.push('</');
    // ret.push(this.tagName.toLowerCase());
    // ret.push('>');
    this.toMarkup2(ret);
  }

  toMarkup2(ret: string[], cb?: (ret: string[]) => void): void {
    if (this.tagName.startsWith(DIRECTIVE_TAG_PREFIX)) {
      return;
    }
    ret.push('<');
    ret.push(this.tagName.toLowerCase());
    this.attributes.forEach(a => (a as ServerAttribute).toMarkup(ret));
    ret.push('>');
    if (VOID_ELEMENTS.has(this.tagName)) {
      return;
    }
    cb
      ? cb(ret)
      : this.childNodes.forEach(n => (n as ServerNode).toMarkup(ret));
    ret.push('</');
    ret.push(this.tagName.toLowerCase());
    ret.push('>');
  }

  override clone(doc: ServerDocument | null, parent: ServerElement | null): ServerElement {
    const ret = new ServerElement(doc, this.tagName, this.loc);
    parent?.appendChild(ret);
    this.attributes.forEach(a => {
      (a as ServerAttribute).clone(doc, ret);
    });
    this.childNodes.forEach(n => {
      (n as ServerNode).clone(doc, ret);
    });
    return ret;
  }
}

// export class ServerTemplateElement extends ServerElement implements TemplateElement {
//   content: ServerDocumentFragment;

//   constructor(
//     doc: ServerDocument | null,
//     name: string,
//     loc: SourceLocation
//   ) {
//     super(doc, name, loc);
//     this.content = new ServerDocumentFragment(loc);
//   }

//   override appendChild(n: Node): Node {
//     return this.content.insertBefore(n, null);
//   }

//   toMarkup(ret: string[]): void {
//     super.toMarkup2(ret, () => {
//       this.content.toMarkup(ret);
//     })
//   }
// }

export class ServerDocument extends ServerElement implements Document {
  jsonLoc = true;

  constructor(loc: string | SourceLocation) {
    super(null, '#document',
      typeof loc === 'string'
        ? {
          source: loc,
          start: { line: 1, column: 0 },
          end: { line: 1, column: 0 },
          i1: 0,
          i2: 0
        }
        : loc
    );
    this.ownerDocument = this;
    this.nodeType = NodeType.DOCUMENT;
  }

  get documentElement(): ServerElement | null {
    for (const e of this.childNodes) {
      if (e.nodeType === NodeType.ELEMENT) {
        return e as ServerElement;
      }
    }
    return null;
  }

  get head(): ServerElement | null {
    const root = this.documentElement;
    if (root) {
      for (const e of root.childNodes ?? []) {
        if (e.nodeType === NodeType.ELEMENT && (e as ServerElement).tagName === 'HEAD') {
          return e as ServerElement;
        }
      }
    }
    return null;
  }

  get body(): ServerElement | null {
    const root = this.documentElement;
    if (root) {
      for (const e of root.childNodes ?? []) {
        if (e.nodeType === NodeType.ELEMENT && (e as ServerElement).tagName === 'BODY') {
          return e as ServerElement;
        }
      }
    }
    return null;
  }

  createTextNode(text: string): Text {
    return new ServerText(this, text, this.loc);
  }

  toJSON(): object {
    return {
      type: this.nodeType,
      children: this.childNodes,
      loc: this.jsonLoc ? this.loc : null
    };
  }

  toMarkup(ret: string[]): void {
    for (const n of this.childNodes) {
      if (n.nodeType === NodeType.ELEMENT) {
        (n as ServerNode).toMarkup(ret);
        break;
      }
    }
  }

  override clone(_: ServerDocument | null, __: ServerElement | null): ServerDocument {
    const ret = new ServerDocument(this.loc);
    this.childNodes.forEach(n => {
      (n as ServerNode).clone(ret, ret);
    });
    return ret;
  }
}

// export class ServerDocumentFragment extends ServerDocument implements DocumentFragment {
//   cloneNode(deep?: boolean): Node {
//     const ret = this.documentElement!.clone(this, null);
//     return ret;
//   }
// }

function escape(text: string, chars = ''): string {
  let r = text;
  if (chars.indexOf('&') >= 0) r = r.split('&').join('&amp;');
  if (chars.indexOf('<') >= 0) r = r.split('<').join('&lt;');
  if (chars.indexOf('>') >= 0) r = r.split('>').join('&gt;');
  if (chars.indexOf('{') >= 0) r = r.split('{').join('&lbrace;');
  if (chars.indexOf('}') >= 0) r = r.split('}').join('&rbrace;');
  if (chars.indexOf('"') >= 0) r = r.split('"').join('&quot;');
  if (chars.indexOf('\'') >= 0) r = r.split('\'').join('&apos;');
  if (chars.indexOf(' ') >= 0) r = r.split(' ').join('&nbsp;');
  if (chars.indexOf('\n') >= 0) r = r.split('\n').join('&#xA;');
  if (chars.indexOf('\r') >= 0) r = r.split('\r').join('&#xD;');
  return r;
}

export function unescapeText(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
