import { Context } from "./runtime/context";

export const PROPS_GLOBAL = '__DOMAZE_PROPS';

declare global {
  interface Window {
    __DOMAZE_PROPS: any;
  }
}

const props = window[PROPS_GLOBAL] || {};
new Context({ doc: document as any, root: props });
