import { assert, it } from 'vitest';
import { cleanMarkup, runPage } from '../util';

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
  ctx.root['attr_lang'] = null;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body></body></html>'
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

it('should access namesake value in outer scopes', async () => {
  const ctx = await runPage('<html :msg="hi"><body :msg=${msg}>${msg}</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>hi</body></html>'
  );
  ctx.root['msg'] = 'hey';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>hey</body></html>'
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
  const ctx = await runPage('<html>'
    + '<body class="base" :class_app=${true}></body></html>');
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
  const ctx = await runPage('<html>'
    + '<body :class_app=${true} class="base"></body></html>');
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
    '<html><head></head><body></body></html>'
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
  const ctx = await runPage('<html>'
    +'<body style="border: 0" :style_color=${"red"}></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="border: 0; color: red;"></body></html>'
  );
  ctx.root['body']['style_color'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="border: 0;"></body></html>'
  );
});

it('should reflect style attribute value (5)', async () => {
  const ctx = await runPage('<html>'
    + '<body :style_color=${"red"} style="border: 0"></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="border: 0; color: red;"></body></html>'
  );
  ctx.root['body']['style_color'] = false;
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body style="border: 0;"></body></html>'
  );
});

// =============================================================================
// texts
// =============================================================================

it('should reflect dynamic text (1)', async () => {
  const ctx = await runPage('<html :msg="hi"><body>${msg}</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>hi</body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>ciao</body></html>'
  );
});

it('should reflect dynamic text (2)', async () => {
  const ctx = await runPage('<html :msg="hi">'
    + '<body>greeting: ${msg}</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: hi</body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: ciao</body></html>'
  );
});

it('should reflect dynamic text (3)', async () => {
  const ctx = await runPage('<html :msg="hi"><body>${msg} :-)</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>hi :-)</body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>ciao :-)</body></html>'
  );
});

it('should reflect dynamic text (4)', async () => {
  const ctx = await runPage('<html :msg="hi">'
    + '<body>greeting: ${msg} :-)</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: hi :-)</body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: ciao :-)</body></html>'
  );
});

it('should reflect dynamic text (5)', async () => {
  const ctx = await runPage('<html :label="greeting" :msg="hi">'
    + '<body>${label}: ${msg} :-)</body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: hi :-)</body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head></head><body>greeting: ciao :-)</body></html>'
  );
});

it('should reflect dynamic atomic text (1)', async () => {
  const ctx = await runPage('<html :msg="hi">'
    + '<head><style>${msg}</style></head><body></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>hi</style></head><body></body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>ciao</style></head><body></body></html>'
  );
});

it('should reflect dynamic atomic text (2)', async () => {
  const ctx = await runPage('<html :msg="hi">'
    + '<head><style>greeting: ${msg}</style></head><body></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: hi</style></head><body></body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: ciao</style></head><body></body></html>'
  );
});

it('should reflect dynamic atomic text (3)', async () => {
  const ctx = await runPage('<html :msg="hi"><head>'
    + '<style>${msg} :-)</style></head><body></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>hi :-)</style></head><body></body></html>'
  );
  ctx.root['msg'] = 'ciao';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>ciao :-)</style></head><body></body></html>'
  );
});

it('should reflect dynamic atomic text (4)', async () => {
  const ctx = await runPage('<html :msg="hi"><head>'
    + '<style>greeting: ${msg} :-)</style></head><body></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: hi :-)</style></head><body></body></html>'
  );
  ctx.root['msg'] = 'hey';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: hey :-)</style></head><body></body></html>'
  );
});

it('should reflect dynamic atomic text (5)', async () => {
  const ctx = await runPage('<html :label="greeting" :msg="hi"><head>'
    + '<style>${label}: ${msg} :-)</style></head><body></body></html>');
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: hi :-)</style></head><body></body></html>'
  );
  ctx.root['msg'] = 'hey';
  assert.equal(
    cleanMarkup(ctx.props.doc),
    '<html><head><style>greeting: hey :-)</style></head><body></body></html>'
  );
});
