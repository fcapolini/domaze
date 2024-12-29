import * as core from "../../core/all";
import { Node } from "../../html/dom";

export interface DefineProps extends core.DefineProps {
  __id: string;
}

export interface Define extends core.Define {
  __dom: Node;
}
