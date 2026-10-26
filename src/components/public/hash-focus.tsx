'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Move keyboard context with explicit deep links, never with passive scrolling. */
export function HashFocus() {
  const pathname = usePathname();
  useEffect(() => {
    let frame = 0;
    let deadline = 0;
    let expectedHash = '';
    const attempt = () => {
      if (!expectedHash) return;
      if (location.hash !== expectedHash) {
        if (performance.now() < deadline)
          frame = requestAnimationFrame(attempt);
        return;
      }
      let id: string;
      try {
        id = decodeURIComponent(expectedHash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (target && document.querySelector('[data-design-ready="true"]')) {
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        return;
      }
      if (performance.now() < deadline) frame = requestAnimationFrame(attempt);
    };
    const schedule = (hash = location.hash) => {
      cancelAnimationFrame(frame);
      expectedHash = hash;
      deadline = performance.now() + 5000;
      // Next's Link finishes its history/focus work after the click handler.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(attempt);
      });
    };
    const click = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === '_blank' ||
        link.hasAttribute('download')
      )
        return;
      const url = new URL(link.href, location.href);
      if (
        url.origin === location.origin &&
        url.pathname === pathname &&
        url.hash
      )
        schedule(url.hash);
    };
    const history = () => schedule();
    schedule();
    document.addEventListener('click', click);
    window.addEventListener('hashchange', history);
    window.addEventListener('popstate', history);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('click', click);
      window.removeEventListener('hashchange', history);
      window.removeEventListener('popstate', history);
    };
  }, [pathname]);
  return null;
}
