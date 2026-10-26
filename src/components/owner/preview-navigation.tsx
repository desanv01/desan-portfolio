'use client';
import { useEffect } from 'react';

/** Keep internal preview navigation inside the same authenticated receipt. */
export function PreviewNavigation({ receipt }: { receipt: string }) {
  useEffect(() => {
    function navigate(event: MouseEvent) {
      const anchor = (event.target as Element)?.closest('a');
      if (
        !anchor ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const raw = anchor.getAttribute('href');
      if (!raw || raw.startsWith('#')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        return;
      }
      if (url.pathname.startsWith('/owner/')) return;
      if (
        !/^\/(?:$|work(?:\/|$)|profile$|journal(?:\/|$)|contact$|resume$|search$|not-found$)/.test(
          url.pathname,
        )
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      url.pathname = `/owner/preview${url.pathname === '/' ? '' : url.pathname}`;
      url.searchParams.set('receipt', receipt);
      window.location.assign(url.pathname + url.search + url.hash);
    }
    function submit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement;
      if (form.method.toLowerCase() !== 'get') return;
      const url = new URL(form.action || location.href);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      for (const [name, value] of new FormData(form))
        if (typeof value === 'string') url.searchParams.set(name, value);
      if (!url.pathname.startsWith('/owner/preview'))
        url.pathname = `/owner/preview${url.pathname === '/' ? '' : url.pathname}`;
      url.searchParams.set('receipt', receipt);
      window.location.assign(url.pathname + url.search);
    }
    document.addEventListener('click', navigate, true);
    document.addEventListener('submit', submit, true);
    return () => {
      document.removeEventListener('click', navigate, true);
      document.removeEventListener('submit', submit, true);
    };
  }, [receipt]);
  return null;
}
