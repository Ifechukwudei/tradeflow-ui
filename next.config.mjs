/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*` 
          : 'https://tradeflow.pxxlspace.cv/api/:path*',
      },
    ];
  },
};

export default nextConfig;
