import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/components/owner/owner.css';

export const metadata: Metadata = {
  title: 'Owner workspace — Desan',
  robots: { index: false, follow: false },
};

export default function OwnerRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
