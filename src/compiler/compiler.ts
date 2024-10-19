import chokidar from 'chokidar';
import { PageError, Source } from '../html/parser';
import { Preprocessor } from '../html/preprocessor';
import * as idom from '../html/dom';
import * as dom from '../html/server-dom';
import * as node from '../runtime/node';
import * as page from '../runtime/page';
import * as value from '../runtime/value';
import { defaultLogger, PageLogicLogger } from '../utils/logger';
import * as ck from './consts';
import * as rk from '../../src/runtime/consts';
import { Observable } from './util';
import { generate } from 'escodegen';
import { astArrayExpression, astLiteral, astLiteralFunction, astObjectExpression, astProperty } from './ast/acorn-utils';
import * as ast from 'acorn';
import { SRC_LOGIC_ATTR_PREFIX } from './compiler-page';
import acorn from 'acorn';

export interface CompilerProps {
  csr?: boolean;
  logger?: PageLogicLogger;
  watch?: boolean;
}

export class Compiler {
  preprocessor: Preprocessor;
  props: CompilerProps;
  logger: PageLogicLogger;
  pages: Map<string, CompiledPage>;
  pending: Map<string, Observable<CompiledPage>>;

  constructor(docroot: string, props: CompilerProps) {
    this.preprocessor = new Preprocessor(docroot);
    this.props = props;
    this.logger = props.logger ?? defaultLogger;
    this.pages = new Map();
    this.pending = new Map();
    if (props.watch) {
      chokidar.watch(docroot, {
        ignorePermissionErrors: true,
        depth: 20,
        ignoreInitial: true,
      }).on('all', () => this.clearCache());
    }
  }

  clearCache() {
    this.logger('debug', '[compiler] clear cache');
    this.pages.clear();
    this.pending.forEach((observable, fname) => {
      observable.addObserver(_ => this.pages.delete(fname));
    });
  }

  async get(fname: string): Promise<CompiledPage> {
    if (this.pages.has(fname)) {
      this.logger('debug', `[compiler] ${fname} is compiled`);
      return this.pages.get(fname)!;
    }
    if (this.pending.has(fname)) {
      this.logger('debug', `[compiler] ${fname} is compiling`);
      const observable = this.pending.get(fname)!;
      return new Promise<CompiledPage>(resolve => {
        observable.addObserver(page => resolve(page));
      });
    }
    this.logger('debug', `[compiler] ${fname} will compile`);
    const observable = new Observable<CompiledPage>();
    this.pending.set(fname, observable);
    const ret = await this.compile(fname);
    // must be set before `observable.notify` so an observer can remove from
    // cache a pending page as soon as it's ready (used by clearCache())
    this.pages.set(fname, ret);
    observable.notify(ret);
    this.pending.delete(fname);
    return ret;
  }

  protected async compile(fname: string): Promise<CompiledPage> {
    const source = await this.preprocessor.load(fname);
    if (source.errors.length) {
      return { errors: source.errors };
    }
    const comp = compilePage(source, this.props.csr);
    return {
      errors: comp.errors,
      doc: comp.doc,
      props: comp.props
    };
  }
}

export interface CompiledPage {
  errors: PageError[];
  doc?: dom.ServerDocument;
  props?: page.PageProps;
}

// =============================================================================
// compilePage()
// =============================================================================

export function compilePage(src: Source, csr?: boolean): CompiledPage {
  const page = new CompilerPage(src.doc);
  const ret: CompiledPage = { errors: page.errors };
  // const global = page.global as ServerGlobal;
  if (page.errors.length) {
    return ret;
  }
  let js, props;
  try {
    js = generate(page.genAST(), {
      format: { compact: true }
    });
    props = eval(`(${js})`);
  } catch (err) {
    page.errors.push(new PageError(
      'error', `compiler internal error: ${err}`, src.doc.loc
    ));
  }
  if (page.errors.length) {
    return ret;
  }
  if (csr) {
    const doc = page.doc as dom.ServerDocument;

    const script1 = new dom.ServerElement(doc, 'script', doc.loc);
    doc.body!.appendChild(script1);
    script1.setAttribute('id', ck.CLIENT_PROPS_SCRIPT_ID);
    const code = `\n${ck.CLIENT_PROPS_SCRIPT_GLOBAL} = ${js}\n`;
    script1.appendChild(new dom.ServerText(doc, code, doc.loc, false));

    const script2 = new dom.ServerElement(doc, 'script', doc.loc);
    doc.body!.appendChild(script2);
    script2.setAttribute('id', ck.CLIENT_CODE_SCRIPT_ID);
    script2.setAttribute('async', null);
    script2.setAttribute('src', ck.CLIENT_CODE_REQ);
  }
  return ret;
}

// =============================================================================
// CompilerPage
// =============================================================================

export class CompilerPage {
  doc: dom.ServerDocument;
  errors: PageError[];
  count: number;
  // as PageProps
  root: CompilerNode;

  constructor(doc: dom.ServerDocument) {
    this.doc = doc;
    this.errors = [];
    this.count = 0;
    this.root = new CompilerNode(this, doc.documentElement!);
  }

  genAST(): ast.ObjectExpression {
    const ret = astObjectExpression(this.doc.loc);
    this.errors.length || this.root.genAST(ret, 'root');
    return ret;
  }
}

// =============================================================================
// CompilerNode
// =============================================================================

export class CompilerNode {
  page: CompilerPage;
  dom: dom.ServerElement;
  // as NodeProps
  id: number;
  name?: string;
  type?: node.NodeType;
  values?: { [key: string]: CompilerValue };
  children: CompilerNode[];

  constructor(page: CompilerPage, e: dom.ServerElement, p?: CompilerNode) {
    this.page = page;
    this.dom = e;
    this.id = page.count++;
    this.name = this.getName(e);
    this.children = [];
    p?.children.push(this);
    e.setAttribute(rk.OUT_ID_ATTR, `${this.id}`);
    for (const key of [...e.getAttributeNames()]) {
      const attr = e.getAttributeNode(key) as dom.ServerAttribute;
      if (this.needsValue(attr)) {
        e.delAttributeNode(attr);
        new CompilerValue(this, attr);
      }
    }
    this.collectChildren(e);
  }

  collectChildren(e: dom.ServerElement) {
    e.childNodes.forEach(n => {
      if (n.nodeType === idom.NodeType.ELEMENT) {
        if (this.needsScope(n as dom.ServerElement)) {
          new CompilerNode(this.page, n as dom.ServerElement, this);
        }
        return;
      }
    });
  }

  needsScope(e: dom.ServerElement) {
    if (ck.SRC_DEF_SCOPE_NAMES[e.tagName]) {
      return true;
    }
    return false;
  }

  needsValue(a: dom.ServerAttribute) {
    if (a.value == null) {
      return false;
    }
    if (a.name.startsWith(SRC_LOGIC_ATTR_PREFIX)) {
      return true;
    }
    return false;
  }

  getName(dom: dom.ServerElement): string | undefined {
    //TODO
    return ck.SRC_DEF_SCOPE_NAMES[dom.tagName];
  }

  genAST(p: ast.ObjectExpression | ast.ArrayExpression, k?: string) {
    const ret = astObjectExpression(this.dom.loc);
    const loc = this.dom.loc;
    if (p.type === 'ObjectExpression') {
      p.properties.push(astProperty(k!, ret, loc));
    } else {
      p.elements.push(ret);
    }
    ret.properties.push(astProperty('id', astLiteral(this.id, loc), loc));
    this.name && this.addLiteral('name', this.name, ret, loc);
    if (this.values) {
      const values = astObjectExpression(loc);
      ret.properties.push(astProperty('values', values, loc));
      Reflect.ownKeys(this.values).forEach(key => {
        typeof key === 'string' && this.values![key].genAST(values, key);
      });
    }
    if (!this.children.length) {
      return;
    }
    const children = astArrayExpression(loc);
    ret.properties.push(astProperty('children', children, loc));
    this.children.forEach(node => node.genAST(children));
  }

  addLiteral(
    key: string,
    val: string | number | boolean,
    obj: ast.ObjectExpression,
    loc: dom.SourceLocation
  ) {
    obj.properties.push(astProperty(key, astLiteral(val, loc), loc));
  }
}

// =============================================================================
// CompilerValue
// =============================================================================

export class CompilerValue {
  attr: dom.ServerAttribute;
  name: string;
  exp: ast.Expression;
  // as ValueProps
  // exp: value.ValueExp;
  // deps?: value.ValueDep[] | undefined;

  constructor(node: CompilerNode, attr: dom.ServerAttribute) {
    this.attr = attr;
    this.name = this.getName(attr.name);
    this.exp = typeof attr.value === 'string'
      ? astLiteralFunction(attr.value, attr.valueLoc!)
      : attr.value!;
    node.values || (node.values = {});
    node.values[this.name] = this;
  }

  getName(name: string): string {
    if (name.startsWith(SRC_LOGIC_ATTR_PREFIX)) {
      return name.substring(SRC_LOGIC_ATTR_PREFIX.length);
    }
    return name;
  }

  genAST(p: ast.ObjectExpression, k: string) {
    const loc = this.attr.valueLoc ?? this.attr.loc;
    const obj = astObjectExpression(loc);
    obj.properties.push(astProperty('exp', this.exp, loc));
    p.properties.push(astProperty(k, obj, loc));
  }
}
