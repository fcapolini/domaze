import * as acorn from 'acorn';
import { Source } from "../html/parser";
import { Preprocessor } from "../html/preprocessor";
import { SourceLocation } from '../html/server-dom';
import { generate } from './generator';
import { load } from "./loader";
import { qualify } from './qualifier';
import { resolve } from './resolver';
import { transform } from './transformer';
import { validate } from './validator';

export interface CompilerPage {
  source: Source;
  root?: CompilerScope;
  code?: acorn.ExpressionStatement;
}

export interface CompilerScope {
  id: number;
  name?: CompilerProp;
  values?: { [key: string]: CompilerValue };
  children: CompilerScope[];
  loc: SourceLocation;
}

export interface CompilerValue {
  val: string | acorn.Expression | null
  keyLoc: SourceLocation;
  valLoc?: SourceLocation;
}

export interface CompilerProp extends CompilerValue {
  val: string;
}

export interface CompilerProps {
  docroot: string;
}

export class Compiler {
  props: CompilerProps;
  preprocessor: Preprocessor;

  constructor(props: CompilerProps) {
    this.props = props;
    this.preprocessor = new Preprocessor(props.docroot);
  }

  async compile(fname: string): Promise<CompilerPage> {
    const page: CompilerPage = {
      source: await this.preprocessor.load(fname),
    };
    if (page.source.errors.length) {
      return page;
    }
    page.root = load(page.source);
    if (page.source.errors.length) {
      return page;
    }
    if (
      !validate(page.source, page.root) ||
      !qualify(page.source, page.root) ||
      !resolve(page.source, page.root) ||
      !transform(page.source, page.root)
    ) {
      return page;
    }
    page.code = generate(page.root);
    return page;
  }

}
