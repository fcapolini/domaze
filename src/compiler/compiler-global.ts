import { Element } from "../html/dom";
import { Global } from "../runtime/global";

export class CompilerGlobal extends Global {
  getElement(id: number, root: Element): Element | null {
    throw new Error("Method not implemented.");
  }

  getMarkup(): string {
    throw new Error("Method not implemented.");
  }
}
