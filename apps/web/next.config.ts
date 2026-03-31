import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trenova/contracts", "@trenova/api-client"],
  serverExternalPackages: ["ably"],
};

export default nextConfig;
