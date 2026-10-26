import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/components/public/public.css';
export const metadata: Metadata = {
  title: 'Private owner preview',
  robots: { index: false, follow: false },
};
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
