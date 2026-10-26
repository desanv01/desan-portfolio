import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { observePreviewDiagnostics } from '../src/components/owner/preview-diagnostics.ts';
const settle = () => new Promise((resolve) => setTimeout(resolve, 25));
test('diagnostics remeasure resized content, captured media loads and font failures without another design-state message', async (t) => {
  const view = new Window(),
    doc = view.document;
  t.after(() => view.happyDOM.close());
  doc.body.innerHTML =
    '<div data-design-root="qa"><article data-design-node="qa-card"><img alt="QA"></article></div>';
  let overflows = false;
  const node = doc.querySelector('article');
  Object.defineProperties(node, {
    clientWidth: { get: () => 100 },
    scrollWidth: { get: () => (overflows ? 130 : 100) },
  });
  const fonts = new view.EventTarget();
  fonts.ready = Promise.resolve();
  let fontError = false;
  fonts[Symbol.iterator] = function* () {
    if (fontError) yield { family: 'QA family', status: 'error' };
  };
  Object.defineProperty(doc, 'fonts', { value: fonts });
  const reports = [];
  const stop = observePreviewDiagnostics(view, doc, (w) => reports.push(w), 0);
  t.after(stop);
  await settle();
  assert.deepEqual(reports.at(-1), []);
  overflows = true;
  view.dispatchEvent(new view.Event('resize'));
  await settle();
  assert.ok(reports.at(-1).some((w) => w.startsWith('qa-card:')));
  overflows = false;
  doc.querySelector('img').dispatchEvent(new view.Event('load'));
  await settle();
  assert.deepEqual(reports.at(-1), []);
  fontError = true;
  fonts.dispatchEvent(new view.Event('loadingerror'));
  await settle();
  assert.ok(reports.at(-1).some((w) => w.startsWith('QA family:')));
  const count = reports.length;
  stop();
  view.dispatchEvent(new view.Event('resize'));
  await settle();
  assert.equal(reports.length, count);
});
test('cleanup cancels a pending font-ready measurement rather than reporting stale diagnostics', async (t) => {
  const view = new Window(),
    doc = view.document;
  t.after(() => view.happyDOM.close());
  let ready;
  const fonts = new view.EventTarget();
  fonts.ready = new Promise((resolve) => (ready = resolve));
  fonts[Symbol.iterator] = function* () {};
  Object.defineProperty(doc, 'fonts', { value: fonts });
  const reports = [];
  const stop = observePreviewDiagnostics(view, doc, (w) => reports.push(w), 0);
  await settle();
  stop();
  ready();
  await settle();
  assert.deepEqual(reports, []);
});
