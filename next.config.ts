import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["policypen.io", "*.policypen.io", "localhost:3000"],
    },
  },
  images: {
    domains: ["policypen.io"],
  },
};

export default nextConfig;
