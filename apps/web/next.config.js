module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/list', destination: '/?tab=list', permanent: true },
      { source: '/product', destination: '/', permanent: false },
      { source: '/profile', destination: '/', permanent: false },
      { source: '/login', destination: '/', permanent: false },
      { source: '/register', destination: '/', permanent: false },
      { source: '/cart', destination: '/?tab=list', permanent: false },
      { source: '/search', destination: '/?tab=search', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/receipt',
        destination: '/api/receipt',
      },
      {
        source: '/api/image-proxy',
        destination: '/api/image-proxy',
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api'}/:path*`,
      },
    ];
  },
};
