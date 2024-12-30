import { assert, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context, SCOPE_ID_ATTR } from '../../src/web/context';
import { ATTR_VALUE_PREFIX, CLASS_VALUE_PREFIX, Scope, STYLE_VALUE_PREFIX } from '../../src/web/scope';

it('should create root', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: { __id: '1' } });
  const root = ctx.root as Scope;
  assert.equal(root.__parent, ctx.global);
  assert.equal(root.__dom, doc.documentElement);
  assert.equal(ctx.cycle, 1);
  assert.equal(
    doc.toString(),
    `<html ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should update an attribute', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_lang: { e: function() { return 'en'; } },
  } });
  assert.equal(doc.documentElement?.getAttribute('lang'), 'en');
  const root = ctx.root as Scope;
  root['attr_lang'] = 'es';
  assert.equal(doc.documentElement?.getAttribute('lang'), 'es');
  assert.equal(
    doc.toString(),
    `<html ${SCOPE_ID_ATTR}="1" lang="es"><head></head><body></body></html>`
  );
  root['attr_lang'] = null;
  assert.equal(doc.documentElement?.getAttribute('lang'), null);
  assert.equal(
    doc.toString(),
    `<html ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should handle attr_class using Element\'s className property', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_class: { e: function() { return 'a b'; } },
  } });
  assert.equal(
    doc.toString(),
    `<html class="a b" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
  assert.equal(doc.documentElement?.classList.length, 2);
  ctx.root[ATTR_VALUE_PREFIX + 'class'] = '';
  assert.equal(doc.documentElement?.classList.length, 1);
  assert.equal(doc.documentElement?.className, '');
  assert.equal(
    doc.toString(),
    `<html class="" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should support class_ values (1)', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_class: { e: function() { return 'a'; }},
    class_b: { e: function() { return true; } },
  } });
  assert.equal(
    doc.toString(),
    `<html class="a b" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
  ctx.root[CLASS_VALUE_PREFIX + 'b'] = false;
  assert.equal(
    doc.toString(),
    `<html class="a" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should support class_ values (2)', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_class: { e: function() { return 'a'; }},
    class_optionalClass: { e: function() { return true; } },
  } });
  assert.equal(
    doc.toString(),
    `<html class="a optional-class" ${SCOPE_ID_ATTR}="1">`
    + `<head></head><body></body></html>`
  );
  ctx.root[CLASS_VALUE_PREFIX + 'optionalClass'] = false;
  assert.equal(
    doc.toString(),
    `<html class="a" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should handle attr_style using Element\'s style property', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_style: { e: function() { return 'color: red'; } },
  } });
  assert.equal(
    doc.toString(),
    `<html style="color: red;" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
  ctx.root[ATTR_VALUE_PREFIX + 'style'] = null;
  assert.equal(
    doc.toString(),
    `<html style="" ${SCOPE_ID_ATTR}="1"><head></head><body></body></html>`
  );
});

it('should support style_ values', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_style: { e: function() { return 'color: red'; }},
    style_borderColor: { e: function() { return 'blue'; } },
  } });
  assert.equal(
    doc.toString(),
    `<html style="color: red; border-color: blue;" ${SCOPE_ID_ATTR}="1">`
    +`<head></head><body></body></html>`
  );
  ctx.root[STYLE_VALUE_PREFIX + 'borderColor'] = 'green';
  assert.equal(
    doc.toString(),
    `<html style="color: red; border-color: green;" ${SCOPE_ID_ATTR}="1">`
    +`<head></head><body></body></html>`
  );
  ctx.root[STYLE_VALUE_PREFIX + 'borderColor'] = null;
  assert.equal(
    doc.toString(),
    `<html style="color: red;" ${SCOPE_ID_ATTR}="1">`
    +`<head></head><body></body></html>`
  );
});
