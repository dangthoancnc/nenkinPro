import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3015", "http://localhost:3015"],
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
  }
};

export default nextConfig;
