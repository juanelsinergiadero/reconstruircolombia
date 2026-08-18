import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone para el Dockerfile multi-stage (runner minimo).
  output: "standalone",
};

export default nextConfig;
