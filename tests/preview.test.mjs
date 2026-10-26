import test from 'node:test';
import { verifyFoundation } from './smoke-helper.mjs';

test('packaged standalone preview HTTP contract', { timeout: 60000 }, (t) =>
  verifyFoundation(t, true),
);
