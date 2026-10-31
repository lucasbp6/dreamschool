import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR permite um build de teste (ex.: .next-test) sem disputar a pasta .next com o `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
