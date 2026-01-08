import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3003",
        "tgfxrewards-aett.vercel.app",
        "*.whop.com",
        "pxb2t8mq5e44w28870qu.apps.whop.com",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.whop.com https://whop.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
