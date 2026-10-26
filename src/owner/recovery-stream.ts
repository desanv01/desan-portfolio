import { createHash } from 'node:crypto';

/** Explicit stream preserves the original JSON contract and avoids a platform
 * buffered-response size ceiling. Authentication happens before construction. */
export function recoveryStream(value: unknown) {
  const text = JSON.stringify(value);
  const encoder = new TextEncoder();
  let offset = 0;
  const sha256 = createHash('sha256').update(text, 'utf8').digest('hex');
  const bytes = Buffer.byteLength(text, 'utf8');
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    pull(controller) {
      if (offset >= text.length) {
        controller.close();
        return;
      }
      let end = Math.min(offset + 32768, text.length);
      // Never encode half a UTF-16 surrogate pair as a replacement character.
      if (
        end < text.length &&
        text.charCodeAt(end - 1) >= 0xd800 &&
        text.charCodeAt(end - 1) <= 0xdbff
      )
        end--;
      controller.enqueue(encoder.encode(text.slice(offset, end)));
      offset = end;
    },
  });
  return { stream, sha256, bytes };
}
