import { expect, it } from 'vitest';
import { parse } from '../../src/html/parser';
import { Context, SCOPE_ID_ATTR } from '../../src/page/context';
import { ATTR_VALUE_PREFIX, Scope } from '../../src/page/scope';

it('should create root', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: { __id: '1' } });
  const root = ctx.root as Scope;
  expect(root.__parent).toBe(ctx.global);
  expect(root.__dom).toBe(doc.documentElement);
  expect(ctx.cycle).toBe(1);
});

it('should update an attribute', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_lang: { e: function() { return 'en'; } },
  } });
  expect(doc.documentElement?.getAttribute('lang')).toBe('en');
  const root = ctx.root as Scope;
  root['attr_lang'] = 'es';
  expect(doc.documentElement?.getAttribute('lang')).toBe('es');
  root['attr_lang'] = null;
  expect(doc.documentElement?.getAttribute('lang')).toBeNull();
});

it('should handle attr_class using className property', () => {
  const doc = parse(`<html ${SCOPE_ID_ATTR}="1"></html>`, 'test').doc;
  const ctx = new Context({ doc, root: {
    __id: '1',
    attr_class: { e: function() { return 'a b'; } },
  } });
  expect(doc.documentElement?.classList.length).toBe(2);
  ctx.root[ATTR_VALUE_PREFIX + 'class'] = null;
  //TODO
  // expect(doc.documentElement?.classList.length).toBe(0);
});
