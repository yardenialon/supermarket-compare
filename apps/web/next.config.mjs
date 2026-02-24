module.exports = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api'}/:path*`,
      },
    ];
  },
};
