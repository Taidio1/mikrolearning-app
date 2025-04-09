import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Wyłącz sprawdzanie ESLint podczas budowania produkcyjnego
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
