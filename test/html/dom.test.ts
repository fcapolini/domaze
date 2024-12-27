import { assert, describe, it } from 'vitest';
import { ServerDocument, ServerElement, SourceLocation } from '../../src/html/server-dom';

const LOC: SourceLocation = {
  start: { line: 0, column: 0 },
  end: { line: 0, column: 0 },
  i1: 0, i2: 0
}

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
