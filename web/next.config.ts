import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // unoptimized for dev speed; in prod, swap to optimized + R2 CDN
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.CORE_MESH_URL ?? 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

export default withNextIntl(nextConfig);
