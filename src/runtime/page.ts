import * as dom from '../html/dom';
import { Global } from './global';
import { Node, NodeProps } from './node';
import { BaseNode } from './nodes/base-node';
import { ForeachNode } from './nodes/foreach-node';
import { Value, ValueProps } from './value';

export interface PageProps {
  root: NodeProps;
}

export abstract class Page {
  doc: dom.Document;
  props: PageProps;
  global: Global;
  root: Node;

  constructor(doc: dom.Document, props: PageProps) {
    this.doc = doc;
    this.props = props;
    this.global = this.newGlobal();
    this.root = this.load(props.root, this.global, doc.documentElement!);
    this.refresh(this.root);
  }

  load(props: NodeProps, p: Node, e: dom.Element): Node {
    const s = this.newNode(props, e)
      .setName(props.name)
      .setValues(props.values)
      .makeObj()
      .linkTo(p);
    if (s instanceof ForeachNode) {
      return s;
    }
    props.children?.forEach(child => {
      const e = this.global.getElement(child.id, s.dom)!;
      this.load(child, s, e);
    });
    return s;
  }

  abstract newGlobal(): Global;

  newNode(props: NodeProps, e: dom.Element): Node {
    if (props.type === 'foreach') {
      return new ForeachNode(this, props, e, this.global);
    }
    return new BaseNode(this, props, e, this.global);
  }

  newValue(node: Node, name: string, props: ValueProps): Value {
    const ret = new Value(this, node, props);
    this.global.setValueCB(name, ret, node);
    return ret;
  }

  // ===========================================================================
  // reactivity
  // ===========================================================================
  cycle = 0;
  refreshLevel = 0;
  pushLevel = 0;

  refresh(node: Node, nextCycle = true) {
    this.refreshLevel++;
    try {
      nextCycle && this.cycle++;
      node.unlinkValues();
      node.linkValues();
      node.updateValues();
    } catch (err) {
      console.error('Context.refresh()', err);
    }
    this.refreshLevel--;
  }
}
