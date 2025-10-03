import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.writelikeme.io',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
