import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*', // Assumes your NestJS is on port 3001
      },
    ]
  },
};

export default nextConfig;
