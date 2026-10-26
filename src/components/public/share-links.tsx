'use client';
import { useState } from 'react';
export function ShareLinks({
  url,
  publicURL,
}: {
  url: string;
  publicURL: boolean;
}) {
  const [status, setStatus] = useState('');
  return (
    <div className="case-block">
      <h2>Share this page</h2>
      <div className="button-group">
        <button
          type="button"
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setStatus(
                'Link copied. Paste it into your LinkedIn post or message.',
              );
            } catch {
              setStatus(`Copy this link: ${url}`);
            }
          }}
        >
          Copy link
        </button>
        {publicURL && (
          <a
            className="button secondary"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on LinkedIn ↗
          </a>
        )}
      </div>
      {!publicURL && (
        <p className="muted">
          This local preview is not publicly reachable. LinkedIn sharing will be
          available when a public site address is configured.
        </p>
      )}
      <p role="status">{status}</p>
    </div>
  );
}
