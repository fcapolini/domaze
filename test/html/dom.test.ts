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
  });

});
