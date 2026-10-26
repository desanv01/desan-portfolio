import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { create as parseFont } from 'fontkit';
import type { CollectionConfig } from 'payload';
import { isOwner, never, requireOwner } from './access';
import { SafeValidationError } from './validation';

/** Browsers may supply no MIME (multipart then uses octet-stream). Only known
 * byte signatures can fill that gap; declared mismatches remain invalid. Full
 * decoding/structural validation still runs in the collection hook below. */
export function uploadMIME(bytes: Buffer, declared: string): string {
  const expected = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? 'image/jpeg'
      : bytes.subarray(0, 4).toString() === 'RIFF' &&
          bytes.subarray(8, 12).toString() === 'WEBP'
        ? 'image/webp'
        : bytes.subarray(0, 4).toString() === 'wOF2'
          ? 'font/woff2'
          : null;
  if (!expected)
    throw new SafeValidationError(
      'Use a valid PNG, JPEG, WebP image or WOFF2 font. Active-content and unknown files are unsupported.',
      ['file'],
    );
  if (
    declared &&
    declared !== 'application/octet-stream' &&
    declared !== expected
  )
    throw new SafeValidationError('File MIME does not match its bytes.', [
      'file',
    ]);
  return expected;
}

export const mediaDirectory = resolve(
  /*turbopackIgnore: true*/
  process.env.MEDIA_DIRECTORY || 'tmp/phase3-media',
);
export const media: CollectionConfig = {
  slug: 'media',
  access: { create: isOwner, read: isOwner, update: isOwner, delete: never },
  upload: {
    staticDir: mediaDirectory,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'font/woff2'],
    filesRequiredOnCreate: true,
    pasteURL: { allowList: [] },
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store');
      return headers;
    },
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
    { name: 'credit', type: 'text' },
    { name: 'license', type: 'text', required: true },
    { name: 'publicEligible', type: 'checkbox', defaultValue: false },
    {
      name: 'kind',
      type: 'select',
      options: ['image', 'document', 'font'],
      required: true,
    },
    {
      name: 'resourceVersion',
      type: 'text',
      required: true,
      access: { update: () => false },
    },
    {
      name: 'sha256',
      type: 'text',
      required: true,
      access: { update: () => false },
    },
  ],
  hooks: {
    beforeOperation: [
      async ({ args, operation, req }) => {
        if (req.file) requireOwner(req);
        if (req.file && operation === 'update')
          throw new SafeValidationError(
            'Media bytes are immutable; upload a new resource and reference its ID',
            ['file'],
          );
        if (req.file && operation === 'create') {
          const file = req.file;
          if (file.size > 10 * 1024 * 1024 || !file.data.length)
            throw new SafeValidationError(
              'Upload must contain 1 byte to 10 MiB',
              ['file'],
            );
          const bytes = file.data;
          const png = bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
          const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
          const webp =
            bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP';
          if (png || jpeg || webp) {
            const expected = png
              ? 'image/png'
              : jpeg
                ? 'image/jpeg'
                : 'image/webp';
            if (file.mimetype !== expected)
              throw new SafeValidationError(
                'File MIME does not match its bytes',
                ['file'],
              );
            const image = sharp(bytes, { limitInputPixels: 40_000_000 });
            try {
              await image.metadata();
              file.data = await image.png().toBuffer();
            } catch {
              throw new SafeValidationError(
                'Image decoding failed or its dimensions exceed the supported limit.',
                ['file'],
              );
            }
            file.mimetype = 'image/png';
            file.name = `${randomUUID()}.png`;
            file.size = file.data.length;
            if (file.size > 10 * 1024 * 1024)
              throw new SafeValidationError(
                'Transformed upload exceeds 10 MiB',
                ['file'],
              );
            args.data.kind = 'image';
          } else if (
            bytes.subarray(0, 4).toString() === 'wOF2' &&
            file.mimetype === 'font/woff2' &&
            bytes.length >= 48 &&
            bytes.readUInt32BE(8) === bytes.length
          ) {
            if (bytes.readUInt32BE(16) > 20 * 1024 * 1024)
              throw new SafeValidationError(
                'Decoded font exceeds resource limit',
                ['file'],
              );
            try {
              const font = parseFont(bytes);
              if (
                'fonts' in font ||
                font.numGlyphs < 1 ||
                font.numGlyphs > 20000
              )
                throw new SafeValidationError(
                  'Unsupported font collection or glyph count',
                  ['file'],
                );
              if (font.characterSet.length > 50000)
                throw new SafeValidationError(
                  'Font character map exceeds resource limit',
                  ['file'],
                );
              const checked = new Set<number>();
              for (const codepoint of font.characterSet) {
                const glyph = font.glyphForCodePoint(codepoint);
                if (!checked.has(glyph.id)) {
                  glyph.path.toSVG();
                  checked.add(glyph.id);
                }
              }
            } catch (error) {
              if (error instanceof SafeValidationError) throw error;
              throw new SafeValidationError(
                'Font decoding failed. Upload a structurally valid WOFF2 font.',
                ['file'],
              );
            }
            file.name = `${randomUUID()}.woff2`;
            args.data.kind = 'font';
          } else
            throw new SafeValidationError(
              'Unsupported, malformed, or active-content upload',
              ['file'],
            );
          args.data.resourceVersion = randomUUID();
          args.data.sha256 = createHash('sha256')
            .update(file.data)
            .digest('hex');
        }
        return args;
      },
    ],
  },
};
