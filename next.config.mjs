/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*` 
          : 'https://tradeflow-production-4a4d.up.railway.app/api/:path*',
      },
    ];
  },
};

export default nextConfig;
