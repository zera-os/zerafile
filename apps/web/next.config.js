/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@zerafile/shared'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/governance',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
