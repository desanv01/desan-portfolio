import 'server-only';
import { cache } from 'react';
import type { PublicSite } from './index';
import { readPublishedSite } from './node-loader';
import { ownerPreviewContext } from './owner-preview-context';

/** React request memoization only; a subsequent request reads the new active revision. */
const readCurrent = cache(readPublishedSite);
export const getPublicSite: () => Promise<PublicSite> = async () =>
  ownerPreviewContext.getStore() || readCurrent();
