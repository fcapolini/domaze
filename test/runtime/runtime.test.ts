import { assert, it } from 'vitest';
import { cleanMarkup, loadPage as runPage } from '../util';

// =============================================================================
// attributes
// =============================================================================

it('should reflect attribute value in root', async () => {
  const ctx = await runPage('<html lang=${"en"}></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html lang="en"><head></head><body></body></html>'
  );
  ctx.root['attr_lang'] = 'es';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html lang="es"><head></head><body></body></html>'
  );
});

it('should reflect attribute value in nested scope', async () => {
  const ctx = await runPage('<html><body class=${"app"}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="app"></body></html>'
  );
  ctx.root['body']['attr_class'] = 'main';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="main"></body></html>'
  );
});

// =============================================================================
// classes
// =============================================================================

it('should reflect class attribute value (1)', async () => {
  const ctx = await runPage('<html><body class="app"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="app"></body></html>'
  );
});

it('should reflect class attribute value (2)', async () => {
  const ctx = await runPage('<html><body class=${"app"}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="app"></body></html>'
  );
  ctx.root['body']['attr_class'] = 'other';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="other"></body></html>'
  );
  ctx.root['body']['attr_class'] = '';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class=""></body></html>'
  );
  ctx.root['body']['attr_class'] = null;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class=""></body></html>'
  );
});

it('should reflect class attribute value (3)', async () => {
  const ctx = await runPage('<html><body :class_app=${true}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="app"></body></html>'
  );
  ctx.root['body']['class_app'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class=""></body></html>'
  );
});

it('should reflect class attribute value (4)', async () => {
  const ctx = await runPage('<html><body class="base" :class_app=${true}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="base app"></body></html>'
  );
  ctx.root['body']['class_app'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="base"></body></html>'
  );
});

it('should reflect class attribute value (5)', async () => {
  const ctx = await runPage('<html><body :class_app=${true} class="base"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="base app"></body></html>'
  );
  ctx.root['body']['class_app'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body class="base"></body></html>'
  );
});

// =============================================================================
// styles
// =============================================================================

it('should reflect style attribute value (1)', async () => {
  const ctx = await runPage('<html><body style="color: red"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="color: red;"></body></html>'
  );
});

it('should reflect style attribute value (2)', async () => {
  const ctx = await runPage('<html><body style=${"color: red"}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="color: red"></body></html>'
  );
  ctx.root['body']['attr_style'] = 'border: 0';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="border: 0"></body></html>'
  );
  ctx.root['body']['attr_style'] = '';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style=""></body></html>'
  );
  ctx.root['body']['attr_style'] = null;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style=""></body></html>'
  );
});

it('should reflect style attribute value (3)', async () => {
  const ctx = await runPage('<html><body :style_color="red"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="color: red;"></body></html>'
  );
  ctx.root['body']['style_color'] = null;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style=""></body></html>'
  );
});

it('should reflect style attribute value (4)', async () => {
  const ctx = await runPage('<html><body style="background: blue" :style_color=${"red"}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="background: blue; color: red;"></body></html>'
  );
  ctx.root['body']['style_color'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="background: blue;"></body></html>'
  );
});

it('should reflect style attribute value (5)', async () => {
  const ctx = await runPage('<html><body :style_color=${"red"} style="background: blue"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="background: blue; color: red;"></body></html>'
  );
  ctx.root['body']['style_color'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="background: blue;"></body></html>'
  );
});
