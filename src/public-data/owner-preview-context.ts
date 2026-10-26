import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { PublicSite } from './index';

// Only the authenticated owner preview route enters this request-local scope.
// No query, cookie, public API or mutable global can select draft data.
export const ownerPreviewContext = new AsyncLocalStorage<PublicSite>();
