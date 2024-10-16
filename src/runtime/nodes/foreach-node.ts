import * as dom from '../../html/dom';
import { Global } from "../global";
import { Page } from "../page";
import { NodeProps } from "../node";
import { BaseNode } from "./base-node";

export class ForeachNode extends BaseNode {
  constructor(page: Page, props: NodeProps, e: dom.Element, global?: Global) {
    super(page, { ...props, type: 'foreach' }, e, global);
  }
}
