import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy to localhost:8000 during local development
    // In production, /api routes are handled by the deployed backend
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
