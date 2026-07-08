import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['100.112.200.242'],
  typescript: {
    // Handle react-webcam package conflicts
    ignoreBuildErrors: false,
    // Explicitly ignore TypeScript errors in node_modules
    tsconfigPath: "./tsconfig.json",
  },
  // Exclude problematic packages from TypeScript compilation
  transpilePackages: ['react-webcam'],
};

export default nextConfig;
