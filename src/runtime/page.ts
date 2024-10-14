import * as dom from '../html/dom';
import { Global } from './global';
import { Scope, ScopeProps } from './scope';
import { ForeachScope } from './scopes/foreach-scope';
import { Value, ValueProps } from './value';

export interface PageProps {
  root: ScopeProps;
}

export abstract class Page {
  doc: dom.Document;
  props: PageProps;
  global: Global;
  root: Scope;

  constructor(doc: dom.Document, props: PageProps) {
    this.doc = doc;
    this.props = props;
    this.global = this.newGlobal();
    this.root = this.load(props.root, this.global, doc.documentElement!);
  }

  load(props: ScopeProps, p: Scope, e: dom.Element): Scope {
    const s = this.newScope(props, e)
      .setName(props.name)
      .setValues(props.values)
      .makeObj()
      .linkTo(p);
    if (s instanceof ForeachScope) {
      return s;
    }
    props.children?.forEach(child => {
      const e = this.global.getElement(child.id, s.e)!;
      this.load(child, s, e);
    });
    return s;
  }

  abstract newGlobal(): Global;

  newScope(props: ScopeProps, e: dom.Element): Scope {
    if (props.type === 'foreach') {
      return new ForeachScope(this, props, e);
    }
    return new Scope(this, props, e);
  }

  newValue(scope: Scope, name: string, props: ValueProps): Value {
    const ret = new Value(this, scope, props);
    this.global.setValueCB(name, ret, scope);
    return ret;
  }
}
