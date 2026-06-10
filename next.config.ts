import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Mark server-side-only packages to avoid client-side bundling issues
  serverExternalPackages: ["pdf-parse", "firebase-admin"],
};

export default nextConfig;
