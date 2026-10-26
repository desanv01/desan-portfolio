'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ownerApi,
  type OwnerRecordPage,
  type OwnerWorkspaceData,
} from './client';
import { OwnerHeading } from './owner-shell';

export function MediaLibrary({
  limits,
}: {
  limits: OwnerWorkspaceData['limits'];
}) {
  const maximumMiB = limits.mediaBytes / (1024 * 1024);
  const [result, setResult] = useState<OwnerRecordPage | null>(null),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0),
    [error, setError] = useState(''),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    let active = true;
    ownerApi<OwnerRecordPage>(`/api/owner/records/media?page=${page}&limit=24`)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [page, refresh]);
  return (
    <>
      <OwnerHeading
        eyebrow="Private resources"
        title="Media library"
        description="Upload licensed images or fonts. Files remain private until a publication explicitly selects them."
      />
      <section className="owner-panel">
        <h2>Upload a resource</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!file) return;
            if (file.size > limits.mediaBytes) {
              setError(`Choose a file no larger than ${maximumMiB} MiB.`);
              return;
            }
            const form = event.currentTarget;
            const fields = new FormData(form);
            const metadata = {
              alt: String(fields.get('alt') || ''),
              caption: String(fields.get('caption') || ''),
              credit: String(fields.get('credit') || ''),
              license: String(fields.get('license') || ''),
              publicEligible: fields.get('publicEligible') === 'on',
            };
            const payload = new FormData();
            payload.set('file', file);
            payload.set('_payload', JSON.stringify(metadata));
            setBusy(true);
            setError('');
            try {
              await ownerApi('/api/owner/media', {
                method: 'POST',
                body: payload,
              });
              setStatus(
                'Resource uploaded privately. Select it in a draft to use it.',
              );
              setRefresh((x) => x + 1);
              setFile(null);
              form.reset();
            } catch (failure) {
              setError((failure as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="owner-fields">
            <label className="owner-field owner-field-wide">
              <span className="owner-label">
                PNG, JPEG, WebP or WOFF2 · up to {maximumMiB} MiB
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,font/woff2,.woff2"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <small>
                Replacement creates a new resource. Existing published bytes are
                never overwritten. PDF and other formats are not supported.
              </small>
            </label>
            <label className="owner-field">
              <span className="owner-label">
                Alternative text / font name *
              </span>
              <input name="alt" required />
            </label>
            <label className="owner-field">
              <span className="owner-label">License or rights basis *</span>
              <input name="license" required />
            </label>
            <label className="owner-field">
              <span className="owner-label">Credit</span>
              <input name="credit" />
            </label>
            <label className="owner-field">
              <span className="owner-label">Caption</span>
              <input name="caption" />
            </label>
            <label className="owner-field owner-field-wide">
              <input type="checkbox" name="publicEligible" />I have permission
              for public use of this resource.
            </label>
          </div>
          <button className="owner-primary" disabled={busy}>
            {busy ? 'Uploading…' : 'Upload privately'}
          </button>
        </form>
      </section>
      {error && (
        <p className="owner-notice" data-tone="error" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="owner-notice" data-tone="success" role="status">
          {status}
        </p>
      )}
      <div className="owner-media-grid">
        {result?.docs.map((record) => (
          <article key={record.id} className="owner-media-card">
            {String(record.data.mimeType).startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/owner/media/${record.id}`}
                alt={String(record.data.alt || '')}
                loading="lazy"
              />
            ) : (
              <div className="owner-empty" aria-hidden="true">
                Aa / FONT
              </div>
            )}
            <h3>{String(record.data.alt || 'Resource')}</h3>
            <p className="owner-muted">
              {String(record.data.license || 'Rights not supplied')}
            </p>
            <span className="owner-badge">
              {record.data.publicEligible ? 'Rights approved' : 'Private use'}
            </span>
            <p>
              <Link href={`/owner/content/media/${record.id}`}>
                Edit metadata →
              </Link>
            </p>
          </article>
        ))}
      </div>
      {!result && !error && <p role="status">Loading media…</p>}
      {result && !result.docs.length && (
        <p className="owner-empty">No resources uploaded yet.</p>
      )}
      {result && result.totalPages > 1 && (
        <nav className="owner-actions" aria-label="Media pages">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>
            {page} / {result.totalPages}
          </span>
          <button
            disabled={page >= result.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </>
  );
}
