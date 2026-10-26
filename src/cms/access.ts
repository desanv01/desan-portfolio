import type { Access, PayloadRequest } from 'payload';
import { APIError } from 'payload';

export function ownerRequest(req: Pick<PayloadRequest, 'user'>): boolean {
  return req.user?.collection === 'owners' && req.user.role === 'owner';
}

export const isOwner: Access = ({ req }) => ownerRequest(req);
export const never: Access = () => false;
export const bootstrapCapability = Object.freeze({
  purpose: 'local-owner-bootstrap',
});

export function requireOwner(req: Pick<PayloadRequest, 'user'>): void {
  if (!ownerRequest(req))
    throw new APIError('Owner authorization required', 403);
}
