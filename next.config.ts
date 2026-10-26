import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

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
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default withPayload(nextConfig);
