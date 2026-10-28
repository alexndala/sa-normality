/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Docker/Railway builds set BUILD_STANDALONE=1. Local builds keep the
  // standard output so `next start` works as usual.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
