import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lexium/ai-agent-engine", "@lexium/shared-contracts"],
};

export default nextConfig;
