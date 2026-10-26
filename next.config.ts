import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { indexable } from './src/public-data/discovery';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Native image libraries are loaded by the OS, outside JavaScript tracing.
  outputFileTracingIncludes: {
    '*': ['./node_modules/@img/sharp-*/lib/**/*'],
  },
  outputFileTracingExcludes: {
    '*': [
      './tmp/**/*',
      './docs/**/*',
      './assets/**/*',
      './output/**/*',
      './.env*',
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/owner/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      ...['/admin/:path*', '/api/:path*', '/search'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
      {
        source: '/:path*',
        headers: indexable()
          ? []
          : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default withPayload(nextConfig);
