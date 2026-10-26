import test from 'node:test';
import { verifyFoundation } from './smoke-helper.mjs';

test(
  'production foundation HTTP contract',
  { timeout: 60000 },
  verifyFoundation,
);
