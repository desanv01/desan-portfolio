import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import '@/components/public/public.css';
import { siteOrigin, indexable } from '@/public-data/discovery';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: 'Desan Vasu — Engineering & ideas',
    template: '%s — Desan Vasu',
  },
  description: 'Work, ideas and the process behind them.',
  robots: { index: indexable(), follow: indexable() },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const preferences = await cookies();
  const saved = preferences.get('desan-mode')?.value;
  const mode = saved === 'light' || saved === 'dark' ? saved : 'dark';
  return (
    <html lang="en" data-mode={mode} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
