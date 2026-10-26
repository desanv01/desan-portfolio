'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ownerApi } from './client';

export function OwnerAuth({
  mode,
  token = '',
  recoveryDeliveryAvailable = false,
}: {
  mode: 'login' | 'recovery' | 'reset';
  token?: string;
  recoveryDeliveryAvailable?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const title =
    mode === 'login'
      ? 'Sign in'
      : mode === 'recovery'
        ? 'Recover access'
        : 'Choose a password';
  return (
    <>
      <header className="owner-auth-header">
        <Link className="owner-brand" href="/">
          <strong>DV</strong>
          <span>OWNER</span>
        </Link>
      </header>
      <main className="owner-auth">
        <p className="owner-eyebrow">Owner access</p>
        <h1>{title}</h1>
        <p className="owner-muted">
          {mode === 'login'
            ? 'Manage your content and site design.'
            : mode === 'recovery'
              ? recoveryDeliveryAvailable
                ? 'Request a recovery link for your owner account.'
                : 'Email recovery is not configured for this site. Use the private owner recovery instructions supplied with your site handover to restore access.'
              : 'Use at least 16 characters. Existing sessions will be invalidated.'}
        </p>
        {(mode !== 'recovery' || recoveryDeliveryAvailable) && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError('');
              setMessage('');
              try {
                if (mode === 'login') {
                  await ownerApi('/api/owners/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                  });
                  router.replace('/owner');
                  router.refresh();
                }
                if (mode === 'recovery') {
                  await ownerApi('/api/owners/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                  });
                  setMessage(
                    'If the account exists, a recovery message has been prepared. Local evaluation uses the private mail capture; delivery is not a public email service.',
                  );
                }
                if (mode === 'reset') {
                  await ownerApi('/api/owners/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ token, password }),
                  });
                  setPassword('');
                  setMessage(
                    'Password updated. Sign in with your new password.',
                  );
                }
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : 'Request failed. Please retry.',
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode !== 'reset' && (
              <label className="owner-field">
                <span className="owner-label">Email</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}
            {mode !== 'recovery' && (
              <label className="owner-field">
                <span className="owner-label">Password</span>
                <div className="owner-password">
                  <input
                    type={show ? 'text' : 'password'}
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={mode === 'reset' ? 16 : undefined}
                    required
                  />
                  <button
                    type="button"
                    aria-label={show ? 'Hide password' : 'Show password'}
                    onClick={() => setShow(!show)}
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
            )}
            {error && (
              <p className="owner-notice" data-tone="error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="owner-notice" data-tone="success" role="status">
                {message}
              </p>
            )}
            {mode === 'reset' && !token && (
              <p role="alert">
                This recovery link is incomplete. Request a new link.
              </p>
            )}
            <button
              className="owner-primary"
              disabled={busy || (mode === 'reset' && !token)}
            >
              {busy ? 'Please wait…' : title}
            </button>
          </form>
        )}
        {mode === 'login' ? (
          <Link href="/owner/recovery">Forgot password?</Link>
        ) : (
          <Link href="/owner/login">Back to sign in</Link>
        )}
        <div className="owner-auth-footer">
          <Link href="/">← Back to site</Link>
        </div>
      </main>
    </>
  );
}
