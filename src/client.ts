import { PROPS_GLOBAL } from "./runtime/const";
import { Context } from "./runtime/context";

declare global {
  interface Window {
    __DOMAZE_PROPS: any;
    __domaze_context: any;
    domaze: any;
  }
}

const props = window[PROPS_GLOBAL] || {};
window.__domaze_context = new Context({ doc: document as any, root: props });
window.domaze = window.__domaze_context.root;
