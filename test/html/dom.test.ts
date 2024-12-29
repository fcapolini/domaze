import { assert, describe, it } from 'vitest';
import { ServerComment, ServerDocument, ServerElement, ServerTemplateElement, ServerText, SourceLocation } from '../../src/html/server-dom';
import { Element, TemplateElement, Text } from '../../src/html/dom';

const LOC: SourceLocation = {
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 },
  i1: 0, i2: 0
}

describe('node', () => {

  it('should append a node', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    assert.equal(doc.toString(), `<html></html>`);
  });

  it('should append a node', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    const text = root.appendChild(new ServerText(doc, 'test', LOC)) as Text;
    assert.equal(doc.toString(), `<html>test</html>`);
    text.unlink();
    assert.equal(doc.toString(), `<html></html>`);
  });

  it('should implement dummy addEventListener()', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    root.addEventListener('dummy', () => {});
  });

  it('should implement dummy removeEventListener()', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    root.removeEventListener('dummy', () => {});
  });

  it('should clone a node', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as ServerElement;
    const t = root.appendChild(new ServerText(doc, 'test', LOC)) as ServerText;
    const e = root.appendChild(new ServerElement(doc, 'div', LOC)) as ServerElement;
    e.setAttribute('class', 'a');
    e.appendChild(new ServerText(doc, 'text', LOC));
    e.appendChild(new ServerElement(doc, 'p', LOC));
    const c = root.appendChild(new ServerComment(doc, 'test', LOC)) as ServerComment;
    assert.equal(
      doc.toString(),
      `<html>test<div class="a">text<p></p></div><!--test--></html>`
    );
    t.clone(doc, root);
    e.clone(doc, root);
    c.clone(doc, root);
    assert.equal(
      doc.toString(),
      `<html>test<div class="a">text<p></p></div><!--test-->`
      + `test<div class="a">text<p></p></div><!--test--></html>`
    );
  });

});

describe('document', () => {

  it('should implement documentElement property', () => {
    const doc = new ServerDocument('test');
    assert.isNull(doc.documentElement);
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC));
    assert.equal(doc.documentElement, root);
  });

  it('should implement head property', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    assert.isNull(doc.head);
    assert.equal(doc.toString(), `<html></html>`);
    const head = root.appendChild(new ServerElement(doc, 'head', LOC));
    assert.equal(doc.head, head);
    assert.equal(doc.toString(), `<html><head></head></html>`);
  });

  it('should implement body property', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    assert.isNull(doc.body);
    assert.equal(doc.toString(), `<html></html>`);
    const body = root.appendChild(new ServerElement(doc, 'body', LOC));
    assert.equal(doc.body, body);
    assert.equal(doc.toString(), `<html><body></body></html>`);
  });

});

describe('classList', () => {

  it('should set w/ className and read w/ classList', () => {
    const doc = new ServerDocument('test');
    const root = new ServerElement(doc, 'html', LOC);
    assert.equal(root.classList.length, 0);
    root.className = 'class1';
    assert.equal(root.classList.length, 1);
    assert.equal(root.classList.toString(), 'class1');
    root.className = 'a b';
    assert.equal(root.classList.length, 2);
    assert.equal(root.classList.toString(), 'a b');
    assert.equal(
      root.toString(),
      `<html class="a b"></html>`
    );
  });

  it('should set w/ classList and read w/ className', () => {
    const doc = new ServerDocument('test');
    const root = new ServerElement(doc, 'html', LOC);
    assert.equal(root.className, '');
    root.classList.add('a');
    assert.equal(root.classList.length, 1);
    assert.equal(root.className, 'a');
    root.classList.add('b');
    assert.equal(root.classList.length, 2);
    assert.equal(root.className, 'a b');
    root.classList.remove('a');
    assert.equal(root.classList.length, 1);
    assert.equal(root.className, 'b');
    root.classList.remove('a');
    assert.equal(root.classList.length, 1);
    assert.equal(root.className, 'b');
    root.classList.remove('b');
    assert.equal(root.classList.length, 0);
    assert.equal(root.className, '');
    assert.equal(
      root.toString(),
      `<html class=""></html>`
    );
  });

});

describe('style', () => {

  it('should set as string', () => {
    const doc = new ServerDocument('test');
    const root = new ServerElement(doc, 'html', LOC);
    assert.deepEqual(root.style.cssText, '');
    root.style = 'color: red';
    assert.equal(root.style.getPropertyValue('color'), 'red');
    root.style = 'margin: 0px; border: 0px';
    assert.equal(root.style.getPropertyValue('color'), '');
    assert.equal(root.style.getPropertyValue('margin'), '0px');
    assert.equal(root.style.getPropertyValue('border'), '0px');
    assert.equal(
      root.toString(),
      `<html style="margin: 0px; border: 0px;"></html>`
    );
  });

  it('should set/get w/ setProperty()/getPropertyValue()', () => {
    const doc = new ServerDocument('test');
    const root = new ServerElement(doc, 'html', LOC);
    root.style.setProperty('color', 'blue');
    assert.equal(root.style.cssText, 'color: blue;');
    root.style.setProperty('border', '0px');
    assert.equal(root.style.cssText, 'color: blue; border: 0px;');
    assert.equal(
      root.toString(),
      `<html style="color: blue; border: 0px;"></html>`
    );
  });

});

describe('template', () => {

  it('should support template tags', () => {
    const doc = new ServerDocument('test');
    const root = doc.appendChild(new ServerElement(doc, 'html', LOC)) as Element;
    const tpl = root.appendChild(new ServerTemplateElement(doc, LOC)) as TemplateElement;
    const p1 = tpl.appendChild(new ServerElement(doc, 'p', LOC)) as Element;
    p1.setAttribute('a', '1');
    p1.appendChild(new ServerText(doc, 'text', LOC));
    const slot = p1.appendChild(new ServerElement(doc, 'slot', LOC)) as Element;
    slot.setAttribute('name', 'slot1');
    assert.equal(
      root.toString(),
      `<html>`
      + `<template><p a="1">text<slot name="slot1"></slot></p></template>`
      + `</html>`
    );

    // - this is the only usage pattern for template tags in the framework
    // - it will work the same in both the client and the server, in spite of
    //   clone being a DocumentFragment in the client and a simple node in the
    //   server
    // - however, this means we can include only a single node in a template
    const clone = root.appendChild(tpl.content.cloneNode(true));

    assert.equal(
      root.toString(),
      `<html>`
      + `<template><p a="1">text<slot name="slot1"></slot></p></template>`
      + `<p a="1">text<slot name="slot1"></slot></p>`
      + `</html>`
    );
  });

});
