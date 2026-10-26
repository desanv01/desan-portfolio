import 'server-only';
import { cache } from 'react';
import type { PublicSite } from './index';
import { readPublishedSite } from './node-loader';

/** React request memoization only; a subsequent request reads the new active revision. */
export const getPublicSite: () => Promise<PublicSite> =
  cache(readPublishedSite);
