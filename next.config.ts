import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@erika/ai-core"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
