import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  createLocalReq,
  getPayload,
  type Payload,
  type PayloadRequest,
} from 'payload';
import config from '../cms/config';
import { SafeValidationError } from '../cms/validation';
import { uploadMIME } from '../cms/media';
import { skillMerge, type SkillMergeInput } from './skill-merge';
import { ownerRequest, requireOwner } from '../cms/access';
import {
  changeSchedule,
  collectionSlug,
  createPreview,
  createSchedule,
  listRecords,
  listSchedules,
  OwnerError,
  readPreview,
  readRecord,
  recoveryExport,
  recoveryImport,
  restoreRecord,
  saveRecord,
  versions,
  workspace,
  publicationHistory,
  processSchedules,
} from './service';
import type { PublicationInput } from '../cms/publication';

const headers = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};
function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers });
}
async function body(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > 3 * 1024 * 1024)
    throw new OwnerError('Request exceeds the editing limit', 413, 'invalid');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new OwnerError('A JSON object is required', 400, 'invalid');
  }
}
function integer(value: string | null, fallback: number) {
  const parsed = Number(value);
  return value && Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

export async function ownerMedia(
  payload: Payload,
  req: PayloadRequest,
  id: string,
  receiptId?: string,
): Promise<Response> {
  requireOwner(req);
  if (receiptId) {
    const { publication } = await readPreview(payload, req, receiptId);
    if (!publication.media.some((m) => String(m.id) === id))
      throw new OwnerError('Media is not in this preview', 404, 'not-found');
  }
  const media = await payload.findByID({
    collection: 'media',
    id,
    depth: 0,
    overrideAccess: false,
    req,
  });
  if (!media.filename || basename(media.filename) !== media.filename)
    throw new OwnerError('Media not found', 404, 'not-found');
  const data = await readFile(
    /*turbopackIgnore: true*/
    resolve(process.env.MEDIA_DIRECTORY || 'tmp/phase3-media', media.filename),
  );
  if (createHash('sha256').update(data).digest('hex') !== media.sha256)
    throw new OwnerError('Media integrity check failed', 409, 'invalid');
  return new Response(new Uint8Array(data), {
    headers: {
      ...headers,
      'Content-Type': media.mimeType || 'application/octet-stream',
      'Content-Disposition': 'inline',
    },
  });
}

/** Explicit endpoint dispatch: no caller-controlled collection/action bypass. */
export async function ownerHTTP(
  request: Request,
  segments: string[],
): Promise<Response> {
  try {
    const method = request.method;
    if (!['GET', 'POST', 'PATCH'].includes(method))
      return json({ error: 'Method not allowed', code: 'method' }, 405);
    if (method !== 'GET') {
      const origin = new URL(
        process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000',
      ).origin;
      if (request.headers.get('origin') !== origin)
        return json({ error: 'Origin denied', code: 'origin' }, 403);
    }
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    const req = await createLocalReq({ user: user || undefined }, payload);
    if (segments.join('/') === 'session' && method === 'GET')
      return json({
        user: ownerRequest(req) ? { id: user!.id, email: user!.email } : null,
      });
    if (!ownerRequest(req))
      return json(
        {
          error:
            'Owner session expired or unavailable. Sign in again; local edits can be retained.',
          code: 'session',
        },
        401,
      );
    const [area, collection, id, action] = segments;
    if (
      area === 'skills' &&
      collection === 'merge' &&
      segments.length === 2 &&
      method === 'POST'
    )
      return json(
        await skillMerge(
          payload,
          req,
          (await body(request)) as SkillMergeInput,
        ),
      );
    if (area === 'workspace' && segments.length === 1 && method === 'GET')
      return json(await workspace(payload, req));
    if (area === 'publications' && segments.length === 1 && method === 'GET')
      return json(
        await publicationHistory(
          payload,
          req,
          integer(new URL(request.url).searchParams.get('page'), 1),
        ),
      );
    if (area === 'records' && collection) {
      collectionSlug(collection);
      if (segments.length === 2) {
        if (method === 'GET') {
          const query = new URL(request.url).searchParams;
          return json(
            await listRecords(
              payload,
              req,
              collection,
              integer(query.get('page'), 1),
              integer(query.get('limit'), 50),
            ),
          );
        }
        if (method === 'POST')
          return json(
            await saveRecord(
              payload,
              req,
              collection,
              (await body(request)).data,
            ),
            201,
          );
      }
      if (segments.length === 3 && id) {
        if (method === 'GET')
          return json(await readRecord(payload, req, collection, id));
        if (method === 'PATCH') {
          const input = await body(request);
          return json(
            await saveRecord(
              payload,
              req,
              collection,
              input.data,
              id,
              String(input.expectedRevision || ''),
            ),
          );
        }
      }
      if (
        segments.length === 4 &&
        id &&
        action === 'versions' &&
        method === 'GET'
      )
        return json(
          await versions(
            payload,
            req,
            collection,
            id,
            integer(new URL(request.url).searchParams.get('page'), 1),
          ),
        );
      if (
        segments.length === 4 &&
        id &&
        action === 'restore' &&
        method === 'POST'
      ) {
        const input = await body(request);
        if (!Number.isSafeInteger(input.versionId))
          throw new OwnerError('A version ID is required', 400, 'invalid');
        return json(
          await restoreRecord(
            payload,
            req,
            collection,
            id,
            String(input.expectedRevision || ''),
            Number(input.versionId),
          ),
        );
      }
    }
    if (area === 'media' && segments.length === 2 && method === 'GET')
      return await ownerMedia(payload, req, collection);
    if (area === 'media' && segments.length === 1 && method === 'POST') {
      const form = await request.formData();
      const file = form.get('file');
      if (
        !(file instanceof File) ||
        file.size < 1 ||
        file.size > 10 * 1024 * 1024
      )
        throw new OwnerError(
          'Upload must contain 1 byte to 10 MiB',
          400,
          'invalid',
        );
      let metadata: unknown;
      try {
        metadata = JSON.parse(String(form.get('_payload') || '{}'));
      } catch {
        throw new OwnerError('Invalid upload metadata', 400, 'invalid');
      }
      // saveRecord's field allowlist also applies to upload metadata.
      const allowed = new Set([
        'alt',
        'caption',
        'credit',
        'license',
        'publicEligible',
      ]);
      if (
        !metadata ||
        typeof metadata !== 'object' ||
        Array.isArray(metadata) ||
        Object.keys(metadata).some((k) => !allowed.has(k))
      )
        throw new OwnerError('Unsupported upload metadata', 400, 'invalid');
      const bytes = Buffer.from(await file.arrayBuffer());
      const mimetype = uploadMIME(bytes, file.type);
      const doc = await payload.create({
        collection: 'media',
        data: metadata as never,
        file: {
          data: bytes,
          name: file.name,
          size: file.size,
          mimetype,
        },
        overrideAccess: false,
        req,
      });
      return json({ doc }, 201);
    }
    if (area === 'previews' && segments.length === 1 && method === 'POST')
      return json(
        await createPreview(
          payload,
          req,
          (await body(request)).input as PublicationInput,
        ),
        201,
      );
    if (area === 'previews' && segments.length === 2 && method === 'GET')
      return json(await readPreview(payload, req, collection));
    if (
      area === 'previews' &&
      segments.length === 4 &&
      id === 'media' &&
      method === 'GET'
    )
      return await ownerMedia(payload, req, action, collection);
    if (area === 'schedules' && segments.length === 1) {
      if (method === 'GET')
        return json(
          await listSchedules(
            payload,
            req,
            integer(new URL(request.url).searchParams.get('page'), 1),
          ),
        );
      if (method === 'POST') {
        const input = await body(request);
        return json(
          await createSchedule(
            payload,
            req,
            String(input.runAt || ''),
            input.input as PublicationInput,
          ),
          201,
        );
      }
    }
    if (
      area === 'schedules' &&
      collection === 'run' &&
      segments.length === 2 &&
      method === 'POST'
    )
      return json({ docs: await processSchedules(payload, req) });
    if (
      area === 'schedules' &&
      segments.length === 3 &&
      ['cancel', 'retry'].includes(id) &&
      method === 'POST'
    )
      return json(
        await changeSchedule(
          payload,
          req,
          collection,
          id as 'cancel' | 'retry',
          String((await body(request)).expectedRevision || ''),
        ),
      );
    if (area === 'export' && segments.length === 1 && method === 'GET')
      return new Response(JSON.stringify(await recoveryExport(payload, req)), {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Disposition':
            'attachment; filename="desan-owner-recovery.json"',
        },
      });
    if (area === 'import' && segments.length === 1 && method === 'POST') {
      const input = await body(request);
      return json(
        await recoveryImport(
          payload,
          req,
          input.bundle,
          input.apply === true,
          (input.expectedRevisions || {}) as Record<string, string>,
        ),
      );
    }
    return json({ error: 'Owner endpoint not found', code: 'not-found' }, 404);
  } catch (error) {
    if (error instanceof SafeValidationError)
      return json(
        { error: error.message, code: 'invalid', fields: error.fields },
        400,
      );
    if (error instanceof OwnerError)
      return json({ error: error.message, code: error.code }, error.status);
    // Payload validation may contain private database values. Expose only known
    // validation field messages, never SQL, stack traces, tokens or file paths.
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number(error.status)
        : 500;
    if (status === 404)
      return json({ error: 'Item not found', code: 'not-found' }, 404);
    return json(
      {
        error:
          status >= 400 && status < 500
            ? 'The submitted data did not pass validation. Check required fields and related records.'
            : 'The operation could not be completed. Your local edits can be retained.',
        code: status >= 400 && status < 500 ? 'invalid' : 'unavailable',
      },
      status >= 400 && status < 500 ? status : 503,
    );
  }
}
