'use client';
import Link from '@/components/public/public-link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="content section">
      <p className="eyebrow">Something went wrong</p>
      <h1>Let’s try that again.</h1>
      <p>This page is temporarily unavailable.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>{' '}
      <Link className="button secondary" href="/">
        Back home
      </Link>
    </main>
  );
}
