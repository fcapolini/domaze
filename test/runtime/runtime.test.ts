import { assert, it } from 'vitest';
import { cleanMarkup, loadPage as runPage } from '../util';

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

// it('should reflect class attribute value', async () => {
//   const ctx = await runPage('<html><body :class_app=${true}></body></html>');
//   assert.equal(
//     cleanMarkup(ctx.props.doc),
//     '<html><head></head><body class="app"></body></html>'
//   );
//   ctx.root['body']['class_app'] = false;
//   assert.equal(
//     cleanMarkup(ctx.props.doc),
//     '<html><head></head><body></body></html>'
//   );
// });
