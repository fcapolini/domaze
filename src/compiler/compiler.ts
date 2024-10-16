import chokidar from 'chokidar';
import { generate } from 'escodegen';
import * as dom from '../html/server-dom';
import { PageError, Source } from '../html/parser';
import { Preprocessor } from '../html/preprocessor';
import { PageProps } from '../runtime/page';
import { ServerGlobal } from '../server/server-global';
import { defaultLogger, PageLogicLogger } from '../utils/logger';
import { CompilerPage } from './compiler-page';
import { Observable } from './util';

export const CLIENT_CODE_SRC = '../client.js';
export const CLIENT_CODE_REQ = '/.pagelogic.js';

export const CLIENT_PROPS_SCRIPT_ID = 'pl-props';
export const CLIENT_PROPS_SCRIPT_GLOBAL = '__pagelogicProps__';
export const CLIENT_CODE_SCRIPT_ID = 'pl-client';
export const CLIENT_DEFAULT_GLOBAL = 'logic';

export interface CompilerProps {
  csr?: boolean;
  logger?: PageLogicLogger;
  watch?: boolean;
}

export interface CompiledPage {
  errors: PageError[];
  doc?: dom.ServerDocument;
  props?: PageProps;
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
    const comp = compile(source, this.props.csr);
    const global = comp.global as ServerGlobal;
    return {
      errors: comp.errors,
      doc: global.page.doc as dom.ServerDocument,
      props: global.pageProps
    };
  }
}

export function compile(src: Source, csr?: boolean): CompilerPage {
  const page = new CompilerPage(src.doc, { root: { id: 0 }} );
  const global = page.global as ServerGlobal;
  if (page.errors.length) {
    return page;
  }
  try {
    global.js = generate(page.ast, {
      format: { compact: true }
    });
    global.props = eval(`(${global.js})`);
  } catch (err) {
    page.errors.push(new PageError(
      'error', `compiler internal error: ${err}`, src.doc.loc
    ));
  }
  if (csr) {
    const doc = page.doc as dom.ServerDocument;

    const script1 = new dom.ServerElement(doc, 'script', doc.loc);
    doc.body!.appendChild(script1);
    script1.setAttribute('id', CLIENT_PROPS_SCRIPT_ID);
    const code = `\n${CLIENT_PROPS_SCRIPT_GLOBAL} = ${global.js}\n`;
    script1.appendChild(new dom.ServerText(doc, code, doc.loc, false));

    const script2 = new dom.ServerElement(doc, 'script', doc.loc);
    doc.body!.appendChild(script2);
    script2.setAttribute('id', CLIENT_CODE_SCRIPT_ID);
    script2.setAttribute('async', null);
    script2.setAttribute('src', CLIENT_CODE_REQ);
  }
  return page;
}
