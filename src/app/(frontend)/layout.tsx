import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import '@/components/public/public.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.CMS_SERVER_URL || 'http://127.0.0.1:3000'),
  title: {
    default: 'Desan Vasu — Engineering & ideas',
    template: '%s — Desan Vasu',
  },
  description: 'Work, ideas and the process behind them.',
  robots: { index: false, follow: false },
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
