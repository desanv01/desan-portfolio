import type { Metadata } from 'next';
import Missing from '../not-found';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

// A normal rendered page: Proxy supplies 404 status before React streaming starts.
// Direct navigation to /not-found is classified and rewritten with 404 as well.
export default function MissingRoute() {
  return <Missing />;
}
