import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
