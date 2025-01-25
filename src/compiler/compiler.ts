import { Source } from "../html/parser";
import { Preprocessor } from "../html/preprocessor";
import { CompilerScope, load } from "./loader";

export interface CompilerPage {
  source: Source;
  root?: CompilerScope;
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
    return page;
  }

}
